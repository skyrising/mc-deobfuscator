// @flow
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
  return: string;

  constructor (args: ?Array<string>, ret: string) {
    this.args = args
    this.return = ret
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
      if (this.args) return filled === methodOrField.sig
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
  let parsedReturn = ''
  let startArgs
  let endArgs
  let array = ''
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
          if (!endArgs) parsedArgs.push(array + cls)
          else parsedReturn = array + cls
          array = ''
        } else {
          if (!endArgs) parsedArgs.push(array + c)
          else parsedReturn = array + c
          array = ''
        }
      }
    }
    if (args.length) {
      const next = args.shift()
      if (!next) throw Error(`Invalid parameter for ${!startArgs || endArgs ? 'return type' : 'argument ' + parsedArgs.length}`)
      if (startArgs && !endArgs) parsedArgs.push(next)
      else parsedReturn = next
    }
  }
  return new Signature(startArgs ? parsedArgs : null, parsedReturn)
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
