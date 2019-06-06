// @flow
import fs from 'fs'
import util from 'util'
import EventEmitter from 'events'
import { perf, lcFirst, toUnderScoreCase } from './index'
import { getExtendedVersionInfo } from './version'
import { printStatus } from './status'
import { getMethodInheritance, parseSignature } from './code'
import { decodeFieldAccessFlags } from './class-reader/util'

const MAX_GENERIC_PASSES = 3
const MAX_SPECIAL_PASSES = 3
const MAX_TOTAL_PASSES = 8

const METHOD_WITH_ARGS = /(.+)\(((?:.+,)*(?:.+))\)/

const debugMd = require('debug')('deobf:md')
const debugCl = require('debug')('deobf:cl')

const slash = s => s.replace(/\./g, '/')

type Task = {
  predicate (info: FullInfo): any;
  run (info: FullInfo): any;
}

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
  enriched: boolean;
  classNameLog: ?WriteStream;
  scheduledTasks: Set<Task>;

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
    this.enriched = false
    this.data = {}
    this.scheduledTasks = new Set()
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
          if (info.enriched) console.warn(Error('Too late to create new skeleton class ' + clsObfName))
          const clsInfo: ClassInfo = classes[clsObfName] = ({
            [util.inspect.custom] (depth, opts) {
              return opts.stylize('[Class ', 'special') +
                opts.stylize(clsObfName, 'string') +
                (this._name ? ' (' + opts.stylize(this._name, 'string') + ')' : '') +
                opts.stylize(']', 'special')
            },
            type: 'class',
            info,
            obfName: clsObfName,
            enumNames: [],
            consts: new Set(),
            subClasses: new Set(),
            get allSubClasses () {
              const all = new Set(this.subClasses)
              for (const scName of this.subClasses) {
                if (!info.classNames.includes(scName)) continue
                const sc = info.class[scName]
                for (const ssc of sc.allSubClasses) all.add(ssc)
              }
              return all
            },
            outerClassName: clsObfName.indexOf('$') > 0 ? clsObfName.slice(0, clsObfName.lastIndexOf('$')) : undefined,
            get outerClass (): ClassInfo {
              if (!this.outerClassName) throw Error(`${this.name || this.obfName} is not an inner class`)
              return info.class[this.outerClassName]
            },
            isInnerClass: clsObfName.indexOf('$') > 0,
            innerClasses: new Set(),
            set name (deobfName: string) {
              this.setName(deobfName, Error().stack.split('\n')[2])
            },
            setName (deobfName: string, by?: string) {
              if (!deobfName) return
              deobfName = deobfName.replace(/\//g, '.')
              if ((clsObfName.startsWith('java.') || clsObfName.startsWith('net.minecraft.')) && deobfName !== clsObfName) {
                this.namedBy = by
                console.warn(new NamingError(this, deobfName))
                return
              }
              const fullDeobfName = deobfName
              if (info.classReverse[deobfName] && info.classReverse[deobfName] !== slash(clsObfName)) {
                this.namedBy = by
                throw new DuplicateNamingError(deobfName, info.class[info.classReverse[deobfName]], this)
              }
              info.classReverse[deobfName] = slash(clsObfName)
              if (this.isInnerClass) {
                const lio$ = deobfName.lastIndexOf('$')
                if (lio$ > 0) {
                  const outerDeobf = deobfName.slice(0, lio$)
                  this.outerClass.setName(outerDeobf, by)
                  deobfName = deobfName.slice(lio$ + 1)
                } else {
                  throw new NamingError(this, fullDeobfName, `${this.outerClass.name || this.outerClassName}$${deobfName}: use full name`)
                }
              }
              if (this._name !== deobfName) {
                info.genericAnalyzed[deobfName] = -1
                info.specialAnalyzed[deobfName] = 0
                if (!this.namedBy) this.namedBy = by
                debugCl('CL: %s %s', slash(clsObfName), slash(fullDeobfName))
                if (info.classNameLog) info.classNameLog.write(`[${info.pass}] ${clsObfName} -> ${fullDeobfName}\n`)
                printStatus(clsObfName + ' -> ' + fullDeobfName)
                info.emit('class-name', { obf: clsObfName, deobf: deobfName, full: fullDeobfName, clsInfo })
                this.done = false
                for (const sc of this.subClasses) info.class[sc].done = false
              }
              this._name = deobfName
            },
            get bestName () {
              if (this.name) return this.name
              if (this.depends) {
                if (typeof this.depends === 'function') {
                  const dependentName = this.depends()
                  if (dependentName) return dependentName
                } else {
                  const dependentName = this.depends !== this && this.depends.bestName
                  if (dependentName) return dependentName
                }
              }
              return this.obfName
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
            fields: new Proxy({}, {
              get (base, key) {
                if (key in base) return base[key]
                const sc = info.class[clsInfo.superClassName]
                if (sc.infoComplete) return sc.fields[key]
              }
            }),
            attributes: {},
            reverseMethod: {},
            method: new Proxy({
              [util.inspect.custom] (depth, opts) {
                return opts.stylize('[Methods: ', 'special') +
                  opts.stylize(Object.keys(this).filter(name => Boolean(this[name].infoComplete)).length, 'number') +
                  opts.stylize(']', 'special')
              }
            }, {
              ownKeys (methods) {
                return Object.keys(methods).filter(fullSig => Boolean(methods[fullSig].infoComplete))
              },
              get (mds, fullSig) {
                if (typeof fullSig !== 'string') return mds[fullSig]
                if (!mds[fullSig]) {
                  if (info.enriched) throw Error('Too late to create skeleton method')
                  const [obfName, sig] = fullSig.split(':')
                  mds[fullSig] = info.newMethod(clsInfo.obfName, obfName, sig)
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
  }

  async init ({ version, side, jarFile, fullClassPath, classNameLog }: {version: Version|string, side: Side, jarFile: string, fullClassPath: Array<string>, classNameLog?: boolean}) {
    this.side = side
    this.jarFile = jarFile
    this.fullClassPath = fullClassPath
    this.estNumClasses = side === 'client' ? 4000 : 2000
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
    if (classNameLog) {
      this.classNameLog = fs.createWriteStream('class-names.log')
    }
  }

  [util.inspect.custom] (depth, opts) {
    return opts.stylize('[FullInfo]', 'special')
  }

  newPass (name: string, passInfo: {weight: number} = { weight: 1 }) {
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
        if (info.classNameLog) info.classNameLog.write(`--- start: ${name} ---\n`)
        const end = perf('pass::' + name)
        this.end = () => {
          if (info.classNameLog) info.classNameLog.write(`--- end: ${name} ---\n\n\n`)
          this.started = false
          this.ended = true
          info.currentPass = undefined
          this.measure = end()
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

  scheduleTask (task: Task) {
    this.scheduledTasks.add(task)
  }

  runScheduledTasks (all: boolean = false) {
    for (const task of this.scheduledTasks) {
      if (all || task.predicate(this)) {
        this.scheduledTasks.delete(task)
        try {
          task.run(this)
        } catch (e) {
          console.error(e)
        }
      }
    }
  }
  
  newField (clsName: string, obfName: string, sig: string, acc: number) {
    const info = this
    return {
      type: 'field',
      clsInfo: this.class[clsName],
      info,
      obfName,
      sig,
      acc,
      flags: decodeFieldAccessFlags(acc),
      getDefaultName () {
        const base = getDefaultNameForFieldType(this)
        const sc = this.clsInfo.superClassName in this.info.class && this.info.class[this.clsInfo.superClassName]
        const fotis = (sc && sc.getVisibleFieldsOfType && sc.getVisibleFieldsOfType(this.sig)) || []
        if (fotis.length + this.clsInfo.fieldsByType[this.sig].length > 1) {
          const index = fotis.length + this.defaultNameIndex
          const b = this.flags.static && this.flags.final ? toUnderScoreCase(base).toUpperCase() + '_' : base
          return b + index
        } else {
          return this.flags.static && this.flags.final ? toUnderScoreCase(base).toUpperCase() : base
        }
      },
      get bestName () {
        if (this.name) return this.name
        if (this.depends) {
          if (typeof this.depends === 'function') {
            const dependentName = this.depends()
            if (dependentName) return dependentName
          } else {
            const dependentName = this.depends !== this && this.depends.bestName
            if (dependentName) return dependentName
          }
        }
        return this.getDefaultName() || this.obfName
      },
      [util.inspect.custom] () {
        return `[Field ${clsInfo.bestName}.${this.bestName}(${this.obfName})]`
      }
    }
  }

  newMethod (clsName: string, obfName: string, sig: string) {
    const key = obfName + ':' + sig
    const info = this
    const clsInfo = this.class[clsName]
    const parsedSig = parseSignature(sig)
    return {
      [util.inspect.custom] (depth, opts) {
        return opts.stylize('[Method ', 'special') +
          util.inspect(this.clsInfo, opts) +
          opts.stylize(obfName, 'string') +
          opts.stylize(sig, 'special') +
          (this._name ? ' (' + opts.stylize(this._name, 'string') + ')' : '') +
          opts.stylize(']', 'special')
      },
      type: 'method',
      info,
      clsInfo,
      obfName,
      sig,
      get argOffsets() {
        if (this.flags.static) return parsedSig.argOffsets
        return parsedSig.argOffsets.map(x => x + 1)
      },
      get argOffsetsInv () {
        if (this._argOffsetsInv) return this._argOffsetsInv
        const offsets = this.argOffsets
        const inv = []
        for (let i = 0; i < offsets.length; i++) {
          inv[offsets[i]] = i
          const type = parsedSig.args[i]
          if (type === 'D' || type === 'J') inv[offsets[i] + 1] = i
        }
        this._argOffsetsInv = inv
        return inv
      },
      get base () {
        if (this._base) return this._base
        if (this.flags.static) return this
        const chain = getMethodInheritance(this)
        const inherited = chain.length > 1 && chain[chain.length - 1]
        if (inherited && key in info.class[inherited].method) {
          this._base = info.class[inherited].method[key]
        } else if (inherited) {
          console.warn('Could not get inherited method info for ' + key + ' from ' + inherited)
          console.log(Object.keys(info.class[inherited].method))
        } else {
          this._base = this
        }
        return this._base
      },
      set name (deobfName) {
        if (!deobfName) return
        if (this.base !== this) {
          this.base.name = deobfName
          console.debug('renaming super(' + this.base.clsInfo.name + ') ' + key + ' -> ' + deobfName)
          return
        }
        const argsMatch = deobfName.match(METHOD_WITH_ARGS)
        if (argsMatch) deobfName = argsMatch[1]
        const argSig = sig + (this.flags.static ? ':static' : '')
        const objectMethods = ['toString', 'clone', 'equals', 'hashCode', '<clinit>', '<init>']
        if (clsInfo.superClassName === 'java/lang/Enum') objectMethods.push('values', 'valueOf')
        if (objectMethods.includes(this.obfName) && deobfName !== this.obfName) {
          console.warn(Error('Tried renaming ' + this.obfName + ' to ' + deobfName))
          return
        }
        if (this.flags.synthetic && !deobfName.includes('$')) {
          console.warn(Error(`Tried renaming synthetic ${this.obfName}${this.sig} to ${deobfName}`))
          return
        }
        if (this._name !== deobfName) {
          if (clsInfo.reverseMethod[deobfName] &&
              argSig in clsInfo.reverseMethod[deobfName] &&
              clsInfo.reverseMethod[deobfName][argSig] !== obfName) {
            console.warn('%s.%s%s already exists (%s vs. %s)',
              (clsInfo.name || clsName), deobfName, argSig,
              clsInfo.reverseMethod[deobfName][argSig], obfName)
            return
          }
          if (this._name) {
            console.debug('%s.%s%s renamed to %s', (clsInfo.name || clsName), this._name, argSig, deobfName)
          }
          debugMd('MD: %s/%s %s %s/%s %s', slash(clsName), obfName, sig, slash(clsInfo.name || clsName), deobfName, sig)
        }
        this._name = deobfName
        if (argsMatch) this.argNames = argsMatch[2].split(',')
        clsInfo.reverseMethod[deobfName] = clsInfo.reverseMethod[deobfName] || []
        clsInfo.reverseMethod[deobfName][argSig] = obfName
      },
      get name () {
        const base = this.base
        if (base && base !== this) return base.name
        if (this._name) return this._name
        return this.obfName
      },
      get bestName () {
        if (this._name) return this._name
        if (this.depends) {
          try {
            if (typeof this.depends === 'function') {
              const dependentName = this.depends()
              if (dependentName && (!this.flags.synthetic || dependentName.includes('$'))) return dependentName
            } else {
              const dependentName = this.depends !== this && this.depends.bestName
              if (dependentName && (!this.flags.synthetic || dependentName.includes('$'))) return dependentName
            }
          } catch (e) {
            console.warn(`${e.message}: ${this.clsInfo.name || this.clsInfo.obfName} depends on ${this.depends}`)
          }
        }
        const base = this.base
        if (base && base !== this) return base.bestName
        if (this.hash && this.obfName.length < 3 && !this.flags.synthetic) return `md_${this.hash & 0xffffff}_${this.obfName}`
        return this.obfName
      }
    }
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
        this.emit('queue', { name, position: 'back' })
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
        this.emit('queue', { name, position: 'front' })
        const pos = this._queue.indexOf(name)
        if (pos >= 0) this._queue.splice(pos, 1)
        this._queue.unshift(name)
      })
    }
  }
}

function getDefaultNameForFieldType (fieldInfo: FieldInfo) {
  const { sig, info } = fieldInfo
  let baseType = sig
  let suffix = ''
  while (baseType[0] === '[') {
    suffix += 's'
    baseType = baseType.slice(1)
  }
  if (baseType[0] === 'L') {
    let name = baseType.slice(1, -1)
    if (name in info.class) {
      const clsInfo = info.class[name]
      name = clsInfo.name || name
    }
    name = lcFirst(name.slice(Math.max(name.lastIndexOf('/'), name.lastIndexOf('.')) + 1))
    name = ({
      boolean: 'aboolean',
      byte: 'abyte',
      class: 'clazz',
      double: 'adouble',
      float: 'afloat',
      long: 'along',
      short: 'ashort'
    })[name] || name
    return name + suffix
  }
  switch (baseType[0]) {
    case 'I': return 'i' + suffix
    case 'J': return 'l' + suffix
    case 'B': return 'b' + suffix
    case 'S': return 's' + suffix
    case 'C': return 'c' + suffix
    case 'Z': return 'flag' + suffix
    case 'F': return 'f' + suffix
    case 'D': return 'd' + suffix
  }
  throw Error('invalid state')
}

export class NamingError extends Error {
  constructor (clsInfo: ClassInfo, deobfName: string, message?: string) {
    super(`Error renaming ${clsInfo.obfName} to ${deobfName} (by ${clsInfo.namedBy})${message ? `: ${message}` : ''}`)
    this.name = 'NamingError'
  }

  [util.inspect.custom] () {
    return this.stack
  }
}

export class DuplicateNamingError extends NamingError {
  deobfName: string;
  a: ClassInfo;
  b: ClassInfo;

  constructor (deobfName: string, a: ClassInfo, b: ClassInfo) {
    super(a, deobfName, `Duplicated name with ${b.obfName} (by ${b.namedBy})`)
    this.name = 'DuplicateNamingError'
    this.deobfName = deobfName
    this.a = a
    this.b = b
  }

  [util.inspect.custom] () {
    return this.stack
  }
}

export async function createInfo (base: {version: Version|string, side: Side, jarFile: string, fullClassPath: Array<string>, classNameLog?: boolean}): Promise<FullInfo> {
  const info = new Info()
  await info.init(base)
  return info
}
