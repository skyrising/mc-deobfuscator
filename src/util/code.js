// @flow
import util from 'util'

function resolve (info: FullInfo, raw: string) {
  if (raw.length === 1 || raw[0] === 'L') return raw
  if (raw[0] === '[') {
    const componentType = resolve(info, raw.slice(1))
    return componentType && '[' + componentType
  }
  const cls = info.classReverse[raw]
  if (cls) return 'L' + cls + ';'
}

class Signature {
  args: ?Array<string>;
  argOffsets: ?Array<number>;
  return: string;

  constructor (args: ?Array<string>, ret: string, argOffsets?: Array<number>) {
    this.args = args
    this.return = ret
    this.argOffsets = argOffsets
  }

  matches (methodOrField: MethodInfo | FieldInfo) {
    const filled = this.fill(methodOrField.info)
    // TODO: wildcards
    if (!filled) {
      methodOrField.done = false
      methodOrField.clsInfo.done = false
      return false
    }
    if (methodOrField.type === 'method') {
      if (this.args) {
        if (!this.return) return methodOrField.sig.startsWith(filled)
        return filled === methodOrField.sig
      }
      return filled === methodOrField.retSig
    }
    return methodOrField.sig === filled
  }

  fill (info: FullInfo) {
    let args
    if (this.args) {
      args = []
      for (let i = 0; i < this.args.length; i++) {
        args[i] = resolve(info, this.args[i])
        if (!args[i]) return
      }
    }
    const ret = resolve(info, this.return)
    if (!ret) return
    return (args ? '(' + args.join('') + ')' : '') + ret
  }
}

export function parseSignature (sig: string) {
  return signatureTag([sig])
}

export function signatureTag (strings: Array<string>, ...args: Array<string>) {
  const parsedArgs = []
  const argOffsets = []
  let parsedReturn = ''
  let startArgs
  let endArgs
  let array = ''
  let nextOffset = 0
  for (const str of strings) {
    for (let i = 0; i < str.length; i++) {
      const c = str[i]
      if (c === '(') {
        if (startArgs) throw Error('Unexpected (')
        startArgs = true
        continue
      }
      if (c === ')') {
        if (endArgs || !startArgs) throw Error('Unexpected )')
        endArgs = true
        continue
      }
      if (startArgs) {
        if (c === '[') {
          array += c
        } else if (c === 'L') {
          const colon = str.indexOf(';', i) + 1
          const cls = str.slice(i, colon)
          i = colon - 1
          if (!endArgs) {
            parsedArgs.push(array + cls)
            argOffsets.push(nextOffset++)
          } else {
            parsedReturn = array + cls
          }
          array = ''
        } else {
          if (!endArgs) {
            parsedArgs.push(array + c)
            argOffsets.push(nextOffset)
            if (!array && (c === 'D' || c === 'J')) nextOffset += 2
            else nextOffset++
          } else {
            parsedReturn = array + c
          }
          array = ''
        }
      }
    }
    if (args.length) {
      const next = args.shift()
      if (!next) throw Error(`Invalid parameter for ${!startArgs || endArgs ? 'return type' : 'argument ' + parsedArgs.length}`)
      if (startArgs && !endArgs) {
        parsedArgs.push(array + next)
        argOffsets.push(nextOffset++)
      } else {
        parsedReturn = array + next
      }
    }
  }
  return new Signature(startArgs ? parsedArgs : null, parsedReturn, argOffsets)
}

const methodInheritance = {}
export function getMethodInheritance (methodInfo: MethodInfo, clsInfo?: ClassInfo) {
  if (clsInfo === null) return []
  if (!clsInfo) clsInfo = methodInfo.clsInfo
  if (!clsInfo) {
    console.warn('No clsInfo:', methodInfo)
    return []
  }
  if (methodInfo.obfName === '<init>' || methodInfo.obfName === '<clinit>') return []
  const methodFullSig = methodInfo.obfName + ':' + methodInfo.sig
  const key = clsInfo.obfName + '/' + methodFullSig
  if (key in methodInheritance) return methodInheritance[key]
  const check = [clsInfo.superClassName, ...clsInfo.interfaceNames]
  for (const c of check) {
    if (!clsInfo.info.class[c].infoComplete) continue
    const superInheritance = getMethodInheritance(methodInfo, clsInfo.info.class[c])
    if (superInheritance && superInheritance.length) {
      const inher = [clsInfo.obfName, ...superInheritance]
      methodInheritance[key] = inher
      return inher
    }
  }
  if (!(methodFullSig in clsInfo.method) || !clsInfo.method[methodFullSig].infoComplete) return []
  methodInheritance[key] = [clsInfo.obfName]
  return methodInheritance[key]
}

export function classNameTask <C: {[string]: string}> (names: C, task: ($ObjMap<C, string => ?string>) => any): Task {
  return {
    predicate (info: FullInfo) {
      for (const name in names) if (!info.classReverse[names[name]]) return false
      return true
    },
    run (info: FullInfo) {
      const mapped: $Shape<$ObjMap<C, string => ?string>> = {}
      for (const name in names) mapped[name] = info.classReverse[names[name]]
      return task(mapped)
    }
  }
}

export function makeCode (lines: Array<CodeLine>) {
  lines = lines.filter(Boolean)
  const code: Code & {code: string} = {
    code: '',
    lines,
    calls: lines.map(l => l.call).filter(Boolean),
    fields: lines.map(l => l.field).filter(Boolean),
    consts: lines.map(l => l.const).filter(c => c !== undefined),
    constants: lines.map(l => l.constant).filter(Boolean),
    matches (predicates: Array<string | RegExp | (CodeLine => any)>) {
      if (predicates.length !== this.lines.length) return false
      for (let i = 0; i < predicates.length; i++) {
        const predicate = predicates[i]
        const line = this.lines[i]
        if (typeof predicate === 'string' && line.op !== predicate) return false
        if (typeof predicate === 'function' && !predicate(line)) return false
        if (predicate instanceof RegExp && !predicate.test(line.op)) return false
      }
      return true
    }
  }
  for (let i = 0; i < code.lines.length - 1; i++) code.lines[i].next = code.lines[i + 1]
  for (let i = 1; i < code.lines.length; i++) code.lines[i].previous = code.lines[i - 1]
  return code
}

const _CodeLine = {
  nextMatching (predicate: CodeLine => boolean, includeSelf = false) {
    if (includeSelf && predicate(this)) return this
    if (!this.next) return
    return this.next.nextMatching(predicate, true)
  },
  nextOp (line: string|Array<string>, includeSelf = false) {
    line = Array.isArray(line) ? line : [line]
    for (const candidate of line) {
      const [op, arg] = candidate.split(' ')
      if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
    }
    if (!this.next) return
    return this.next.nextOp(line, true)
  },
  prevMatching (predicate: CodeLine => boolean, includeSelf = false) {
    if (includeSelf && predicate(this)) return this
    if (!this.next) return
    return this.next.prevMatching(predicate, true)
  },
  prevOp (line: string|Array<string>, includeSelf = false) {
    line = Array.isArray(line) ? line : [line]
    for (const candidate of line) {
      const [op, arg] = candidate.split(' ')
      if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
    }
    if (!this.previous) return
    return this.previous.prevOp(line, true)
  },
  [util.inspect.custom] () {
    return this.op + ' ' + this.arg
  }
}

export function makeCodeLine (obj: $Shape<CodeLine> = {}): CodeLine {
  return Object.assign(Object.create(_CodeLine), obj)
}

export function getSuperClassChain(clsInfo: ClassInfo): Array<string> {
  if (clsInfo.superClassName === 'java.lang.Object') return []
  const sc = clsInfo.superClassName in info.class && info.class[clsInfo.superClassName]
  if (!sc) {
    return [clsInfo.superClassName]
  }
  const chain = getSuperClassChain(sc)
  chain.splice(0, 0, clsInfo.superClassName)
  return chain
}
