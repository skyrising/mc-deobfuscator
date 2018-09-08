// @flow
import util from 'util'
import EventEmitter from 'events'
import {perf} from './index'
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
  running: number;
  pass: number;
  passAnalyzed: number;
  maxParallel: number;
  numAnalyzed: number;
  classAnalyzeAvg: number;
  _queue: Array<string>;
  genericAnalyzed: {[string]: number};
  specialAnalyzed: {[string]: number};
  totalAnalyzed: {[string]: number};
  classReverse: {[string]: ?string};
  class: {[string]: ClassInfo};
  method: {[string]: MethodInfo};
  data: {[string]: any};
  classNames: Array<string>;
  side: Side;
  version: Version;
  passes: Array<Pass>;
  currentPass: ?Pass;

  constructor () {
    super()
    const info = this
    this.running = 0
    this.pass = -1
    this.passes = []
    this.passAnalyzed = 0
    this.maxParallel = 0
    this.numAnalyzed = 0
    this.classAnalyzeAvg = 0
    this._queue = []
    this.genericAnalyzed = {}
    this.specialAnalyzed = {}
    this.totalAnalyzed = {}
    this.classReverse = {}
    this.class = new Proxy(({
      [util.inspect.custom] (depth, opts) {
        return opts.stylize('[Classes: ', 'special') +
          opts.stylize(Object.keys(this).filter(name => Boolean(this[name].bin)).length, 'number') +
          opts.stylize(']', 'special')
      }
    }: {[string]: ClassInfo}), {
      ownKeys (classes) {
        return Object.keys(classes).filter(name => Boolean(classes[name].bin))
      },
      get (classes, clsObfName) {
        if (typeof clsObfName !== 'string') return classes[clsObfName]
        clsObfName = clsObfName.replace(/\//g, '.')
        if (!classes[clsObfName]) {
          const clsInfo: ClassInfo = classes[clsObfName] = ({
            [util.inspect.custom] (depth, opts) {
              return opts.stylize('[Class ', 'special') +
                opts.stylize(clsObfName, 'string') +
                (this._name ? ' (' + opts.stylize(this._name, 'string') + ')' : '') +
                opts.stylize(']', 'special')
            },
            info,
            obfName: clsObfName,
            enumNames: [],
            consts: new Set(),
            subClasses: new Set(),
            outerClassName: clsObfName.indexOf('$') > 0 ? clsObfName.slice(0, clsObfName.lastIndexOf('$')) : undefined,
            get outerClass (): ClassInfo {
              if (!this.outerClassName) throw Error(`${this.name || this.obfName} is not an inner class`)
              return info.class[this.outerClassName]
            },
            isInnerClass: clsObfName.indexOf('$') > 0,
            set name (deobfName: string) {
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
                this.done = false
                for (const sc of this.subClasses) info.class[sc].done = false
              }
              this._name = deobfName
              info.classReverse[deobfName] = slash(clsObfName)
            },
            get name (): ?string {
              return this._name
            },
            set package (pkg: string) {
              if (this._name) return console.warn('Cannot set package: already named')
              this._package = pkg
            },
            get package (): ?string {
              return this._package
            },
            get numLines (): number {
              return ((Object.values(this.method): any): Array<MethodInfo>)
                .reduce((sum, m) => sum + (m.code ? m.code.lines.length : 0), 0)
            },
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
          }: any)
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
    this.data = {}
  }

  async init ({version, side, classNames}: {version: Version|string, side: Side, classNames: Array<string>}) {
    this.side = side
    this.classNames = classNames
    const [, versionMajor, versionMinor, versionPatch] = (typeof version === 'string' ? version : version.id)
      .match(/^(\d+)\.(\d+)(\.\d+)?/) || []
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

  newPass (name: string, passInfo: {weight: number} = {weight: 1}) {
    const info = this
    const pass = {
      name,
      ...passInfo,
      started: false,
      ended: false,
      analyzed: 0,
      start () {
        if (this.ended) throw Error('Tried to restart pass')
        if (this.started) throw Error('Pass already started')
        if (info.currentPass) {
          const current = info.currentPass
          console.warn(`Pass '${current.name}' already running`)
          current.end()
        }
        info.pass++
        info.passAnalyzed = 0
        info.currentPass = this
        const end = perf('pass::' + name)
        this.end = () => {
          this.started = false
          this.ended = true
          info.currentPass = undefined
          end()
        }
        this.started = true
      },
      end () {
        throw Error('Pass has not started yet')
      }
    }
    this.passes.push(pass)
    return pass
  }

  get hasWork (): boolean {
    return Boolean(this._queue.length)
  }

  dequeue (): ?string {
    const name = this._queue.shift()
    if (!name) return
    if (this.genericAnalyzed[name] === -1) {
      this.specialAnalyzed[name] = (this.specialAnalyzed[name] || 0) + 1
    } else {
      this.genericAnalyzed[name] = (this.genericAnalyzed[name] || 0) + 1
    }
    this.totalAnalyzed[name] = (this.totalAnalyzed[name] || 0) + 1
    return name
  }

  get queue (): ?string {
    return this.dequeue()
  }

  set queue (items: string | Array<string>) {
    this.queueBack(items)
  }

  queueBack (items: string | Array<string>) {
    if (!items) return
    if (!Array.isArray(items)) items = [items]
    for (const name of items) {
      if (this._queue.includes(name)) continue
      if (!this.classNames.includes(name)) {
        console.warn('Not queueing unknown class %s', name)
        continue
      }
      if (this.genericAnalyzed[name] >= MAX_GENERIC_PASSES) continue
      if (this.specialAnalyzed[name] >= MAX_SPECIAL_PASSES) continue
      if (this.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
      if (this.totalAnalyzed[name] >= this.pass) this.pass = this.totalAnalyzed[name] + 1
      ;(this.class[name].analyzing || Promise.resolve()).then(() => {
        if (this._queue.includes(name)) return
        console.debug('Queueing %s (%s, back)', (this.class[name].name || name), Math.max(this.genericAnalyzed[name], this.specialAnalyzed[name]) || 'new')
        this.emit('queue', {name, position: 'back'})
        this._queue.push(name)
      })
    }
  }

  queueFront (items: string | Array<string>) {
    if (!items) return
    if (!Array.isArray(items)) items = [items]
    for (const name of items) {
      if (!this.classNames.includes(name)) {
        console.warn('Not queueing unknown class %s', name)
        continue
      }
      if (this.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
      ;(this.class[name].analyzing || Promise.resolve()).then(() => {
        this.class[name].done = false
        console.debug('Queueing %s (%s, front)', (this.class[name].name || name), Math.max(this.genericAnalyzed[name], this.specialAnalyzed[name]) || 'new')
        this.emit('queue', {name, position: 'front'})
        const pos = this._queue.indexOf(name)
        if (pos >= 0) this._queue.splice(pos, 1)
        this._queue.unshift(name)
      })
    }
  }
}

export async function createInfo (base: {version: Version|string, side: Side, classNames: Array<string>}): Promise<FullInfo> {
  const info = new Info()
  await info.init(base)
  return info
}
