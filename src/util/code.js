import util from 'util'
import {parseClassSignature} from './parse'

const ACC_PUBLIC = 0x0001
const ACC_PRIVATE = 0x0002
const ACC_PROTECTED = 0x0004
const ACC_STATIC = 0x0008
const ACC_FINAL = 0x0010
const ACC_VOLATILE = 0x0040
const ACC_TRANSIENT = 0x0080
const ACC_SYNTHETIC = 0x1000
const ACC_ENUM = 0x4000

export async function getCode (method) {
  let code
  try {
    code = await method.getCodeAsync().then(c => c.toStringAsync())
  } catch (e) {
    return {code: '', lines: [], calls: [], internalCalls: [], fields: [], internalFields: [], consts: []}
  }
  const calls = []
  const fields = []
  const consts = []
  const internalCalls = []
  const internalFields = []
  const lines = code.split('\n').filter(l => /^\d+:/.test(l)).map(l => {
    const match = l.match(/^(\d+):\s*([^\t]+)\s*(.*?)(?: \(\d+\))?$/)
    if (!match) return
    const [, offset, op, arg] = match
    const line = {offset: +offset, op, arg, [util.inspect.custom]: () => op + ' ' + arg}
    if (op === 'invokestatic' || op === 'invokevirtual' || op === 'invokespecial' || op === 'invokeinterface') {
      const fullSig = arg
      const [, pkg, className, methodName, signature] = fullSig.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const call = {fullSig, pkg, className, methodName, signature, [util.inspect.custom]: () => op + ' ' + fullSig}
      call.fullClassName = pkg ? pkg + '.' + className : className
      line.call = call
      calls.push(call)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalCalls.push(call)
    } else if (op === 'getfield' || op === 'getstatic') {
      const [, pkg, className, fieldName, type] = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const field = {fullSig: arg, pkg, className, fieldName, type, [util.inspect.custom]: () => op + ' ' + arg}
      field.fullClassName = pkg ? pkg + '.' + className : className
      line.field = field
      fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalFields.push(field)
    } else if (op === 'putfield' || op === 'putstatic') {
      const [, pkg, className, fieldName, type] = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const field = {fullSig: arg, pkg, className, fieldName, type, [util.inspect.custom]: () => op + ' ' + arg}
      field.fullClassName = pkg ? pkg + '.' + className : className
      line.field = field
      fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalFields.push(field)
    } else if (op === 'ldc_w' || op === 'ldc' || op === 'bipush' || op === 'sipush' || op === 'ipush') {
      try {
        line.const = JSON.parse(arg)
      } catch (e) {
        line.const = arg
      }
      consts.push(line.const)
    } else if (op.startsWith('iconst_')) {
      line.const = +op[7]
      consts.push(line.const)
    } else if (op === 'new') {
      line.className = arg.slice(1, -1)
    } else if (/^[ilfda]load_\d$/.test(op)) {
      line.load = +op[6]
      line.loadType = op[0]
    } else if (/^[ilfda]load$/.test(op)) {
      line.load = +arg.slice(1)
      line.loadType = op[0]
    } else if (/^[ilfda]return$/.test(op)) {
      line.return = true
      line.returnType = op[0]
    }
    Object.assign(line, {
      nextOp (line, includeSelf = false) {
        line = Array.isArray(line) ? line : [line]
        for (const candidate of line) {
          const [op, arg] = candidate.split(' ')
          if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        }
        if (!this.next) return
        return this.next.nextOp(line, true)
      },
      prevOp (line, includeSelf = false) {
        line = Array.isArray(line) ? line : [line]
        for (const candidate of line) {
          const [op, arg] = candidate.split(' ')
          if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        }
        if (!this.previous) return
        return this.previous.prevOp(line, true)
      }
    })
    return line
  }).filter(l => !!l)
  for (let i = 0; i < lines.length - 1; i++) lines[i].next = lines[i + 1]
  for (let i = 1; i < lines.length; i++) lines[i].previous = lines[i - 1]
  return {code, lines, calls, internalCalls, fields, internalFields, consts}
}

function resolve (info, raw) {
  if (raw.length === 1 || raw[0] === 'L') return raw
  const cls = info.classReverse[raw]
  if (cls) return 'L' + cls + ';'
}

class Signature {
  constructor (args, ret) {
    this.args = args
    this.return = ret
  }

  matches (methodInfo) {
    const filled = this.fill(methodInfo.info)
    // TODO: wildcards
    if (!filled) methodInfo.clsInfo.done = false
    else return methodInfo.sig === filled
  }

  fill (info) {
    const args = []
    for (let i = 0; i < this.args.length; i++) {
      args[i] = resolve(info, this.args[i])
      if (!args[i]) return
    }
    const ret = resolve(info, this.return)
    if (!ret) return
    return '(' + args.join('') + ')' + ret
  }
}

// TODO: arrays
export function signatureTag (strings, ...args) {
  const parsedArgs = []
  let parsedReturn
  let startArgs
  let endArgs
  for (const str of strings) {
    for (let i = 0; i < str.length; i++) {
      const c = str[i]
      if (c === '(') {
        if (startArgs) throw Error('Unexpected (')
        startArgs = true
        continue
      }
      if (c === ')') {
        if (endArgs) throw Error('Unexpected )')
        endArgs = true
        continue
      }
      if (startArgs) {
        if (c === 'L') {
          const colon = str.indexOf(';', i) + 1
          const cls = str.slice(i, colon)
          i = colon - 1
          if (!endArgs) parsedArgs.push(cls)
          else parsedReturn = cls
        } else {
          if (!endArgs) parsedArgs.push(c)
          else parsedReturn = c
        }
      }
    }
    if (args.length) {
      const next = args.shift()
      if (!next) throw Error(`Invalid parameter for ${endArgs ? 'return type' : 'argument ' + parsedArgs.length}`)
      if (!endArgs) parsedArgs.push(next)
      else parsedReturn = next
    }
  }
  return new Signature(parsedArgs, parsedReturn)
}

const methodInheritance = {}
export function getMethodInheritance (methodInfo, clsInfo) {
  if (clsInfo === null) return []
  if (!clsInfo) clsInfo = methodInfo.clsInfo
  if (!clsInfo) console.warn('No clsInfo:', methodInfo)
  if (!clsInfo) return []
  const methodFullSig = methodInfo.origName + ':' + methodInfo.sig
  const key = clsInfo.obfName + '/' + methodFullSig
  if (key in methodInheritance) return methodInheritance[key]
  const check = [clsInfo.superClassName, ...clsInfo.interfaceNames]
  for (const c of check) {
    if (!clsInfo.info.class[c].bin) continue
    const superInheritance = getMethodInheritance(methodInfo, clsInfo.info.class[c])
    if (superInheritance && superInheritance.length) {
      const inher = [clsInfo.obfName, ...superInheritance]
      methodInheritance[key] = inher
      return inher
    }
  }
  if (!clsInfo.method[methodFullSig].bin) return []
  methodInheritance[key] = [clsInfo.obfName]
  return methodInheritance[key]
}

export async function enrichClsInfo (cls, info) {
  const className = await cls.getClassNameAsync()
  const clsInfo = info.class[className]
  if (clsInfo.bin) return clsInfo
  clsInfo.superClassName = await cls.getSuperclassNameAsync()
  info.class[clsInfo.superClassName].subClasses.add(className)
  clsInfo.interfaceNames = await cls.getInterfaceNamesAsync()
  for (const ifn of clsInfo.interfaceNames) info.class[ifn].subClasses.add(className)
  clsInfo.bin = cls
  clsInfo.isInterface = await cls.isInterfaceAsync()
  for (const attr of await cls.getAttributes()) {
    const name = await attr.getNameAsync()
    clsInfo.attributes[name] = attr
    if (name === 'Signature') {
      clsInfo.rawGenericSignature = await attr.getSignatureAsync()
      ;[clsInfo.genericSignature] = parseClassSignature(clsInfo.rawGenericSignature)
      console.debug(clsInfo.obfName, clsInfo.rawGenericSignature, JSON.stringify(clsInfo.genericSignature))
    }
  }
  for (const md of await cls.getMethodsAsync()) {
    const methodInfo = clsInfo.method[(await md.getNameAsync()) + ':' + (await md.getSignatureAsync())]
    methodInfo.bin = md
    methodInfo.isAbstract = await md.isAbstract()
  }
  for (const fd of await cls.getFieldsAsync()) {
    const acc = await fd.getAccessFlags()
    const fieldInfo = {
      clsInfo,
      obfName: await fd.getNameAsync(),
      type: await fd.getTypeAsync(),
      public: Boolean(acc & ACC_PUBLIC),
      private: Boolean(acc & ACC_PRIVATE),
      protected: Boolean(acc & ACC_PROTECTED),
      static: Boolean(acc & ACC_STATIC),
      final: Boolean(acc & ACC_FINAL),
      volatile: Boolean(acc & ACC_VOLATILE),
      transient: Boolean(acc & ACC_TRANSIENT),
      synthetic: Boolean(acc & ACC_SYNTHETIC),
      enum: Boolean(acc & ACC_ENUM),
      get name () {
        return clsInfo.field[this.obfName]
      },
      set name (name) {
        clsInfo.field[this.obfName] = name
      }
    }
    fieldInfo.sig = await fieldInfo.type.getSignatureAsync()
    clsInfo.fields[fieldInfo.obfName] = fieldInfo
  }
  return clsInfo
}
