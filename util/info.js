import util from 'util'
import {getExtendedVersionInfo} from './version'
import {printStatus} from './status'
import {getMethodInheritance} from './code'

const MAX_GENERIC_PASSES = 3
const MAX_SPECIAL_PASSES = 3
const MAX_TOTAL_PASSES = 8

const debugMd = require('debug')('deobf:md')
const debugCl = require('debug')('deobf:cl')

const slash = s => s.replace(/\./g, '/')

export async function createInfo ({version, side, classNames}) {
  const [, versionMajor, versionMinor, versionPatch] = version.match(/^(\d+)\.(\d+)(\.\d+)?/) || []
  const info = {
    side,
    version: {
      ...(await getExtendedVersionInfo(version)),
      major: versionMajor && +versionMajor,
      minor: versionMinor && +versionMinor,
      patch: versionPatch && +versionPatch,
      toString () {
        return version
      }
    },
    running: 0,
    pass: 0,
    maxParallel: 0,
    numAnalyzed: 0,
    classAnalyzeAvg: 0,
    classNames,
    _queue: [...classNames],
    genericAnalyzed: {},
    specialAnalyzed: {},
    totalAnalyzed: {},
    namedQueue: [],
    get hasWork () {
      return !!info._queue.length
    },
    get queue () {
      const name = info.namedQueue.shift()
      if (info.genericAnalyzed[name] === -1) {
        info.specialAnalyzed[name] = (info.specialAnalyzed[name] || 0) + 1
      } else {
        info.genericAnalyzed[name] = (info.genericAnalyzed[name] || 0) + 1
      }
      info.totalAnalyzed[name] = (info.totalAnalyzed[name] || 0) + 1
      return info._queue.shift()
    },
    set queue (items) {
      if (!items) return
      if (!Array.isArray(items)) items = [items]
      for (const item of items) {
        const name = typeof item === 'string' ? item : item.getClassName()
        if (info.namedQueue.includes(name)) continue
        if (info.genericAnalyzed[name] >= MAX_GENERIC_PASSES) continue
        if (info.specialAnalyzed[name] >= MAX_SPECIAL_PASSES) continue
        if (info.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
        if (info.totalAnalyzed[name] >= info.pass) info.pass = info.totalAnalyzed[name] + 1
        ;(info.class[name].analyzing || Promise.resolve()).then(() => {
          if (info.namedQueue.includes(name)) return
          console.debug('Queueing %s (%s, back)', (info.class[name].name || name), Math.max(info.genericAnalyzed[name], info.specialAnalyzed[name]) || 'new')
          info._queue.push(item)
          info.namedQueue.push(name)
        })
      }
    },
    queueFront (items) {
      if (!items) return
      if (!Array.isArray(items)) items = [items]
      for (const item of items) {
        const name = typeof item === 'string' ? item : item.getClassName()
        if (info.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
        ;(info.class[name].analyzing || Promise.resolve()).then(() => {
          info.class[name].done = false
          console.debug('Queueing %s (%s, front)', (info.class[name].name || name), Math.max(info.genericAnalyzed[name], info.specialAnalyzed[name]) || 'new')
          info._queue.unshift(item)
          info.namedQueue.unshift(name)
        })
      }
    },
    classReverse: {},
    class: new Proxy({
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
              const origDeobfName = deobfName
              if (this.isInnerClass) deobfName = deobfName.slice(deobfName.lastIndexOf(deobfName.includes('$') ? '$' : '.') + 1)
              if (this._name !== deobfName) {
                info.genericAnalyzed[deobfName] = -1
                info.specialAnalyzed[deobfName] = 0
                debugCl('CL: %s %s', slash(clsObfName), slash(deobfName))
                printStatus(clsObfName + ' -> ' + deobfName)
                info.queue = clsObfName
                for (const sc of this.subClasses) info.queue = sc
              }
              this._name = deobfName
              info.classReverse[origDeobfName] = slash(clsObfName)
            },
            get name () {
              return this._name
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
                          console.info('%s.%s%s renamed to %s', (clsInfo.name || clsObfName), this._name, argSig, deobfName)
                        }
                        debugMd('MD: %s/%s %s %s/%s %s', slash(clsObfName), origName, sig, slash(classes[clsObfName].name || clsObfName), deobfName, sig)
                        const inherited = getMethodInheritance(this)[1]
                        if (inherited) {
                          info.class[inherited].method[fullSig].name = deobfName
                          console.log('renaming super(' + inherited + ') ' + fullSig + ' -> ' + deobfName)
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
    }),
    method: new Proxy({}, {
      get (obj, fullSig) {
        if (typeof fullSig !== 'string') return
        const className = fullSig.slice(0, fullSig.lastIndexOf('.', fullSig.indexOf(':')))
        const methodSig = fullSig.slice(className.length + 1)
        return info.class[className].method[methodSig]
      }
    })
  }
  return info
}
