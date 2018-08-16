import util from 'util'
import EventEmitter from 'events'
import {getExtendedVersionInfo} from './version'
import {printStatus} from './status'
import {getMethodInheritance} from './code'

const MAX_GENERIC_PASSES = 3
const MAX_SPECIAL_PASSES = 3
const MAX_TOTAL_PASSES = 8

const debugMd = require('debug')('deobf:md')
const debugCl = require('debug')('deobf:cl')

const slash = s => s.replace(/\./g, '/')

class Info extends EventEmitter {
  constructor () {
    super()
    const info = this
    this.running = 0
    this.pass = 0
    this.maxParallel = 0
    this.numAnalyzed = 0
    this.classAnalyzeAvg = 0
    this._queue = []
    this.genericAnalyzed = {}
    this.specialAnalyzed = {}
    this.totalAnalyzed = {}
    this.namedQueue = []
    this.classReverse = {}
    this.class = new Proxy({
      [util.inspect.custom] (depth, opts) {
        return opts.stylize('[Classes: ', 'special') +
          opts.stylize(Object.keys(this).filter(name => Boolean(this[name].bin)).length, 'number') +
          opts.stylize(']', 'special')
      }
    }, {
      ownKeys (classes) {
        return Object.keys(classes).filter(name => Boolean(classes[name].bin))
      },
      get (classes, clsObfName) {
        if (typeof clsObfName !== 'string') return classes[clsObfName]
        clsObfName = clsObfName.replace(/\//g, '.')
        if (!classes[clsObfName]) {
          const clsInfo = classes[clsObfName] = {
            [util.inspect.custom] (depth, opts) {
              return opts.stylize('[Class ', 'special') +
                opts.stylize(clsObfName, 'string') +
                (this._name ? ' (' + opts.stylize(this._name, 'string') + ')' : '') +
                opts.stylize(']', 'special')
            },
            info,
            obfName: clsObfName,
            consts: new Set(),
            subClasses: new Set(),
            outerClassName: clsObfName.indexOf('$') > 0 ? clsObfName.slice(0, clsObfName.lastIndexOf('$')) : undefined,
            get outerClass () {
              if (!this.outerClassName) throw Error(`${this.name || this.obfName} is not an inner class`)
              return info.class[this.outerClassName]
            },
            isInnerClass: clsObfName.indexOf('$') > 0,
            set name (deobfName) {
              if (clsObfName.startsWith('java.')) {
                console.warn(Error('Tried renaming ' + clsObfName))
                return
              }
              deobfName = deobfName.replace(/\//g, '.')
              if (info.classReverse[deobfName] && info.classReverse[deobfName] !== slash(clsObfName)) {
                throw Error(`Duplicate name ${deobfName}: ${info.classReverse[deobfName]}, ${slash(clsObfName)}`)
              }
              if (this.isInnerClass) deobfName = deobfName.slice(deobfName.lastIndexOf(deobfName.includes('$') ? '$' : '.') + 1)
              if (this._name !== deobfName) {
                info.genericAnalyzed[deobfName] = -1
                info.specialAnalyzed[deobfName] = 0
                debugCl('CL: %s %s', slash(clsObfName), slash(deobfName))
                printStatus(clsObfName + ' -> ' + deobfName)
                info.emit('class-name', {obf: clsObfName, deobf: deobfName, clsInfo})
                info.queue = clsObfName
                for (const sc of this.subClasses) info.queue = sc
              }
              this._name = deobfName
              info.classReverse[deobfName] = slash(clsObfName)
            },
            get name () {
              return this._name
            },
            set package (pkg) {
              if (this._name) return console.warn('Cannot set package: already named')
              this._package = pkg
            },
            get package () {
              return this._package
            },
            get numLines () {
              return Object.values(this.method).reduce((sum, m) => sum + (m.code ? m.code.lines.length : 0), 0)
            },
            field: new Proxy({}, {
              /*
              set (base, key, value) {
              }
              */
            }),
            fields: {},
            attributes: {},
            reverseMethod: {},
            method: new Proxy({
              [util.inspect.custom] (depth, opts) {
                return opts.stylize('[Methods: ', 'special') +
                  opts.stylize(Object.keys(this).filter(name => Boolean(this[name].bin)).length, 'number') +
                  opts.stylize(']', 'special')
              }
            }, {
              ownKeys (methods) {
                return Object.keys(methods).filter(fullSig => Boolean(methods[fullSig].bin))
              },
              get (mds, fullSig) {
                if (typeof fullSig !== 'string') return mds[fullSig]
                if (!mds[fullSig]) {
                  const [origName, sig] = fullSig.split(':')
                  mds[fullSig] = {
                    [util.inspect.custom] (depth, opts) {
                      return opts.stylize('[Method ', 'special') +
                        util.inspect(this.clsInfo, opts) +
                        opts.stylize(origName, 'string') +
                        opts.stylize(sig, 'special') +
                        (this._name ? ' (' + opts.stylize(this._name, 'string') + ')' : '') +
                        opts.stylize(']', 'special')
                    },
                    info,
                    clsInfo,
                    origName,
                    sig,
                    static: false,
                    set name (deobfName) {
                      const argSig = fullSig.slice(fullSig.indexOf('('), fullSig.indexOf(')') + 1) + (this.static ? ':static' : '')
                      const objectMethods = ['toString', 'clone', 'equals', 'hashCode', '<clinit>', '<init>']
                      if (clsInfo.superClassName === 'java/lang/Enum') objectMethods.push('values', 'valueOf')
                      if (objectMethods.includes(this.origName) && deobfName !== this.origName) {
                        console.warn(Error('Tried renaming ' + this.origName + ' to ' + deobfName))
                        return
                      }
                      if (this._name !== deobfName) {
                        if (clsInfo.reverseMethod[deobfName] &&
                            argSig in clsInfo.reverseMethod[deobfName] &&
                            clsInfo.reverseMethod[deobfName][argSig] !== origName) {
                          console.warn('%s.%s%s already exists (%s vs. %s)',
                            (clsInfo.name || clsObfName), deobfName, argSig,
                            clsInfo.reverseMethod[deobfName][argSig], origName)
                          return
                        }
                        if (this._name) {
                          console.debug('%s.%s%s renamed to %s', (clsInfo.name || clsObfName), this._name, argSig, deobfName)
                        }
                        debugMd('MD: %s/%s %s %s/%s %s', slash(clsObfName), origName, sig, slash(classes[clsObfName].name || clsObfName), deobfName, sig)
                        const inherited = getMethodInheritance(this)[1]
                        if (inherited) {
                          info.class[inherited].method[fullSig].name = deobfName
                          console.debug('renaming super(' + inherited + ') ' + fullSig + ' -> ' + deobfName)
                        }
                      }
                      this._name = deobfName
                      clsInfo.reverseMethod[deobfName] = clsInfo.reverseMethod[deobfName] || []
                      clsInfo.reverseMethod[deobfName][argSig] = origName
                    },
                    get name () {
                      if (this._name) return this._name
                      const inherited = getMethodInheritance(this)[1]
                      if (inherited) return info.class[inherited].method[fullSig].name
                      return this.origName
                    }
                  }
                }
                return mds[fullSig]
              }
            })
          }
        }
        return classes[clsObfName]
      },
      set (classes, clsObfName, value) {
        throw Error(`Setting info.class.${clsObfName} to ${value} is not allowed`)
      }
    })
    this.method = new Proxy({}, {
      get (obj, fullSig) {
        if (typeof fullSig !== 'string') return
        const className = fullSig.slice(0, fullSig.lastIndexOf('.', fullSig.indexOf(':')))
        const methodSig = fullSig.slice(className.length + 1)
        return info.class[className].method[methodSig]
      }
    })
  }

  async init ({version, side, classNames}) {
    this.side = side
    this.classNames = classNames
    const [, versionMajor, versionMinor, versionPatch] = (version.id || version).match(/^(\d+)\.(\d+)(\.\d+)?/) || []
    this.version = {
      ...(await getExtendedVersionInfo(version)),
      major: versionMajor && +versionMajor,
      minor: versionMinor && +versionMinor,
      patch: versionPatch && +versionPatch,
      toString () {
        return version.id || version
      }
    }
    this._queue.push(...classNames)
  }

  get hasWork () {
    return !!this._queue.length
  }

  dequeue () {
    const name = this.namedQueue.shift()
    if (this.genericAnalyzed[name] === -1) {
      this.specialAnalyzed[name] = (this.specialAnalyzed[name] || 0) + 1
    } else {
      this.genericAnalyzed[name] = (this.genericAnalyzed[name] || 0) + 1
    }
    this.totalAnalyzed[name] = (this.totalAnalyzed[name] || 0) + 1
    return this._queue.shift()
  }

  get queue () {
    return this.dequeue()
  }

  set queue (items) {
    this.queueBack(items)
  }

  queueBack (items) {
    if (!items) return
    if (!Array.isArray(items)) items = [items]
    for (const item of items) {
      const name = typeof item === 'string' ? item : item.getClassName()
      if (this.namedQueue.includes(name)) continue
      if (this.genericAnalyzed[name] >= MAX_GENERIC_PASSES) continue
      if (this.specialAnalyzed[name] >= MAX_SPECIAL_PASSES) continue
      if (this.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
      if (this.totalAnalyzed[name] >= this.pass) this.pass = this.totalAnalyzed[name] + 1
      ;(this.class[name].analyzing || Promise.resolve()).then(() => {
        if (this.namedQueue.includes(name)) return
        console.debug('Queueing %s (%s, back)', (this.class[name].name || name), Math.max(this.genericAnalyzed[name], this.specialAnalyzed[name]) || 'new')
        this.emit('queue', {item, name, position: 'back'})
        this._queue.push(item)
        this.namedQueue.push(name)
      })
    }
  }

  queueFront (items) {
    if (!items) return
    if (!Array.isArray(items)) items = [items]
    for (const item of items) {
      const name = typeof item === 'string' ? item : item.getClassName()
      if (this.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
      ;(this.class[name].analyzing || Promise.resolve()).then(() => {
        this.class[name].done = false
        console.debug('Queueing %s (%s, front)', (this.class[name].name || name), Math.max(this.genericAnalyzed[name], this.specialAnalyzed[name]) || 'new')
        this.emit('queue', {item, name, position: 'front'})
        this._queue.unshift(item)
        this.namedQueue.unshift(name)
      })
    }
  }
}

export async function createInfo (base) {
  const info = new Info()
  await info.init(base)
  return info
}
