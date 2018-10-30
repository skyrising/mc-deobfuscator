// @flow
import util from 'util'
import java from 'java'
import { initJava, getAllClasses } from './java'
import { parseClassSignature, parseFieldTypeSignature } from '../parse'
import { h2, hsig, base26 } from '../hash'
import { decodeClassAccessFlags, decodeMethodAccessFlags, decodeFieldAccessFlags } from '../class-reader/util'
import { lcFirst } from '../index'
import * as C from '../class-reader/constants'

function decodeLine (l: string, parent: Code, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>): ?CodeLine {
  const match = l.match(/^(\d+):\s*([^\t]+)\s*(.*?)(?: \(\d+\))?$/)
  if (!match) return
  const [, offset, op, arg] = match
  const line: CodeLine = ({
    offset: +offset,
    op,
    arg,
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
    [util.inspect.custom]: () => op + ' ' + arg
  }: any)
  if (op === 'invokestatic' || op === 'invokevirtual' || op === 'invokespecial' || op === 'invokeinterface') {
    const fullSig = arg
    const match = fullSig.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
    if (match) {
      const [, pkg, className, methodName, signature] = match
      const call: OpCall = {
        fullSig,
        pkg,
        className,
        methodName,
        signature,
        fullClassName: pkg ? pkg + '.' + className : className,
        [util.inspect.custom]: () => op + ' ' + fullSig
      }
      line.call = call
      parent.calls.push(call)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') parent.internalCalls.push(call)
    }
  } else if (op === 'invokedynamic') {
    const match = arg.match(/\((\d+)\)\t00$/)
    if (match) {
      const index = +match[1]
      const cInvokeDynamic = expandConstant(cp, index)
      const bootMethod = bm[cInvokeDynamic.bootstrapMethodAttrIndex]
      const bootMethodRef = expandConstant(cp, bootMethod.getBootstrapMethodRef())
      const argIndexes = [...bootMethod.getBootstrapArguments()]
      const bootMethodArgs = argIndexes.map(n => expandConstant(cp, n))
      line.invokeDynamic = {
        bootstrapMethod: {
          method: bootMethodRef,
          args: bootMethodArgs,
          argIndexes
        },
        name: cInvokeDynamic.nameAndType.name,
        descriptor: cInvokeDynamic.nameAndType.descriptor
      }
    }
  } else if (op === 'getfield' || op === 'getstatic') {
    const match = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
    if (match) {
      const [, pkg, className, fieldName, type] = match
      const field: OpField = {
        fullSig: arg,
        pkg,
        className,
        fieldName,
        type,
        fullClassName: pkg ? pkg + '.' + className : className,
        [util.inspect.custom]: () => op + ' ' + arg
      }
      line.field = field
      parent.fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') parent.internalFields.push(field)
    }
  } else if (op === 'putfield' || op === 'putstatic') {
    const match = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
    if (match) {
      const [, pkg, className, fieldName, type] = match
      const field: OpField = {
        fullSig: arg,
        pkg,
        className,
        fieldName,
        type,
        fullClassName: pkg ? pkg + '.' + className : className,
        [util.inspect.custom]: () => op + ' ' + arg
      }
      line.field = field
      parent.fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') parent.internalFields.push(field)
    }
  } else if (op === 'ldc_w' || op === 'ldc2_w' || op === 'ldc' || op === 'bipush' || op === 'sipush' || op === 'ipush') {
    try {
      line.const = parseConst(arg)
    } catch (e) {
      console.debug('cannot parse constant: %s (%s)', arg, e)
      line.const = arg
    }
    parent.consts.push(line.const)
  } else if (op.startsWith('iconst_')) {
    line.const = +op[7]
    parent.consts.push(line.const)
  } else if (op === 'new' || op === 'instanceof') {
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
  return line
}

function expandConstant (cp: BCELConstantPool, index: number) {
  const c = cp.getConstant(index)
  const tag = c.getTag()
  switch (tag) {
    case C.CONSTANT_Utf8:
    case C.CONSTANT_Integer:
    case C.CONSTANT_Float:
    case C.CONSTANT_Long:
    case C.CONSTANT_Double:
      return c.getBytes()
    case C.CONSTANT_Class:
    case C.CONSTANT_String:
      return c.getBytes(cp)
    case C.CONSTANT_Fieldref: case C.CONSTANT_Methodref: case C.CONSTANT_InterfaceMethodref:
      return {
        class: expandConstant(cp, c.getClassIndex()),
        nameAndType: expandConstant(cp, c.getNameAndTypeIndex())
      }
    case C.CONSTANT_NameAndType:
      return {
        name: expandConstant(cp, c.getNameIndex()),
        descriptor: expandConstant(cp, c.getSignatureIndex())
      }
    case C.CONSTANT_MethodHandle:
      return {
        refKind: c.getReferenceKind(),
        ref: expandConstant(cp, c.getReferenceIndex())
      }
    case C.CONSTANT_MethodType:
      return {
        descriptor: expandConstant(cp, c.getDescriptorIndex())
      }
    case C.CONSTANT_Dynamic: case C.CONSTANT_InvokeDynamic:
      return {
        bootstrapMethodAttrIndex: c.getBootstrapMethodAttrIndex(),
        nameAndType: expandConstant(cp, c.getNameAndTypeIndex())
      }
    case C.CONSTANT_Module: case C.CONSTANT_Package:
      return {
        name: expandConstant(cp, c.getNameIndex())
      }
  }
}

function parseConst (c: string) {
  if (/^\d+$/.test(c)) {
    const i = BigInt.asIntN(64, c)
    if (i >> BigInt(32)) return i
    return Number(i)
  }
  return JSON.parse(c)
}

export async function getCode (method: BCELMethod, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>): Promise<Code> {
  let source
  try {
    source = await method.getCodeAsync().then(c => c.toStringAsync())
  } catch (error) {
    return { code: '', lines: [], calls: [], internalCalls: [], fields: [], internalFields: [], consts: [], matches: () => false, error }
  }
  const code: Code = {
    code: source,
    lines: [],
    calls: [],
    fields: [],
    consts: [],
    internalCalls: [],
    internalFields: [],
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
  code.lines = source.split('\n')
    .filter(l => /^\d+:/.test(l))
    .map(l => decodeLine(l, code, cp, bm))
    .filter(Boolean)
  for (let i = 0; i < code.lines.length - 1; i++) code.lines[i].next = code.lines[i + 1]
  for (let i = 1; i < code.lines.length; i++) code.lines[i].previous = code.lines[i - 1]
  return code
}

export async function enrichClsInfo (cls: BCELClass, info: FullInfo): Promise<ClassInfo> {
  const className = await cls.getClassNameAsync()
  const clsInfo: ClassInfo = info.class[className]
  if (clsInfo.infoComplete) return clsInfo
  let hash = 1
  clsInfo.superClassName = await cls.getSuperclassNameAsync()
  if (clsInfo.superClassName.startsWith('java')) hash = h2(hash, clsInfo.superClassName)
  info.class[clsInfo.superClassName].subClasses.add(className)
  clsInfo.interfaceNames = await cls.getInterfaceNamesAsync()
  hash = h2(hash, clsInfo.interfaceNames.map((s, i) => s.startsWith('java') ? s : i))
  for (const ifn of clsInfo.interfaceNames) info.class[ifn].subClasses.add(className)
  clsInfo.bin = cls
  const acc = await cls.getAccessFlagsAsync()
  clsInfo.flags = decodeClassAccessFlags(acc)
  hash = h2(hash, clsInfo.flags.abstract)
  hash = h2(hash, clsInfo.flags.interface)
  await getAttributes([clsInfo, cls])
  const cp = await cls.getConstantPoolAsync()
  const bm = 'BootstrapMethods' in clsInfo.attributes ? clsInfo.attributes.BootstrapMethods.getBootstrapMethods() : []
  for (const md of await cls.getMethodsAsync()) {
    const name = await md.getNameAsync()
    const sig = await md.getSignatureAsync()
    const methodInfo: MethodInfo = clsInfo.method[name + ':' + sig]
    const acc = await md.getAccessFlagsAsync()
    hash = h2(hash, acc)
    Object.assign((methodInfo: any), {
      bin: md,
      acc,
      flags: decodeMethodAccessFlags(acc),
      clsInfo,
      info,
      origName: name,
      sig,
      args: await md.getArgumentTypesAsync(),
      ret: await md.getReturnTypeAsync(),
      code: await getCode(md, cp, bm),
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
        return this.origName
      }
    })
    // TODO: await getAttributes([methodInfo, md])
    methodInfo.argSigs = methodInfo.args.map(t => t.getSignature())
    hash = h2(hash, methodInfo.argSigs.map(hsig))
    methodInfo.retSig = await methodInfo.ret.getSignatureAsync()
    hash = h2(hash, hsig(methodInfo.retSig))
    hash = h2(hash, methodInfo.flags.abstract)
    for (const c of methodInfo.code.consts) {
      if (typeof c === 'string') clsInfo.consts.add(c)
    }
    methodInfo.infoComplete = true
  }
  hash = h2(hash, [...clsInfo.consts])
  const fieldsByType = {}
  for (const fd of await cls.getFieldsAsync()) {
    const acc = await fd.getAccessFlagsAsync()
    const fieldInfo: FieldInfo = ({
      type: 'field',
      clsInfo,
      info,
      obfName: await fd.getNameAsync(),
      fieldType: await fd.getTypeAsync(),
      acc,
      flags: decodeFieldAccessFlags(acc),
      getDefaultName () {
        const base = getDefaultNameForFieldType(this)
        if (fieldsByType[fieldInfo.sig].length > 1) {
          return base + (this.defaultNameIndex + 1)
        } else {
          return base
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
      }
    }: any)
    await getAttributes([fieldInfo, fd])
    hash = h2(hash, acc)
    fieldInfo.sig = await fieldInfo.fieldType.getSignatureAsync()
    const sameType = fieldsByType[fieldInfo.sig] = fieldsByType[fieldInfo.sig] || []
    fieldInfo.defaultNameIndex = sameType.length
    sameType.push(fieldInfo)
    hash = h2(hash, hsig(fieldInfo.sig))
    clsInfo.fields[fieldInfo.obfName] = fieldInfo
  }
  clsInfo.hash = hash
  clsInfo.hashBase26 = base26(hash)
  clsInfo.infoComplete = true
  return clsInfo
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
    const clsInfo = info.class[baseType.slice(1, -1)]
    let name = clsInfo.name || clsInfo.obfName
    name = name.slice(name.lastIndexOf('.') + 1)
    return lcFirst(name) + suffix
  }
  switch (baseType[0]) {
    case 'I': return 'i'
    case 'J': return 'l'
    case 'B': return 'b'
    case 'S': return 's'
    case 'C': return 'c'
    case 'Z': return 'flag'
    case 'F': return 'f'
    case 'D': return 'd'
  }
}

async function getAttributes (arg: [ClassInfo, BCELClass] | [FieldInfo, BCELField]) {
  const base = arg[0]
  const attributes = await arg[1].getAttributesAsync()
  const parse = ({
    field: parseFieldTypeSignature,
    class: parseClassSignature
  })[base.type]
  base.attributes = {}
  for (const attr of attributes) {
    const name = await attr.getNameAsync()
    base.attributes[name] = attr
    if (name === 'Signature') {
      base.rawGenericSignature = await attr.getSignatureAsync()
      Object.defineProperty(base, 'genericSignature', {
        get () {
          if (!this._genericSignature) this._genericSignature = parse(this.rawGenericSignature)[0]
          return this._genericSignature
        }
      })
    }
  }
}

export async function readAllClasses (info: FullInfo) {
  const Repository = await initJava(info.fullClassPath)
  const classNames = getAllClasses(info.jarFile).filter(name => !name.includes('.') || name.startsWith('net.minecraft'))
  info.classNames = classNames
  const forEachClass = (fn: (BCELClass, ClassInfo) => any) => Promise.all(classNames.map(async name => {
    try {
      const cls = await Repository.lookupClass(name)
      const clsInfo = info.class[name]
      await fn(cls, clsInfo)
      if (info.currentPass) info.currentPass.analyzed++
    } catch (e) {
      console.warn(e)
    }
  }))
  console.log(classNames.length + ' classes, ' + classNames.filter(name => !name.includes('$')).length + ' outer classes')
  await forEachClass(cls => enrichClsInfo(cls, info))
  info.enriched = true
}
