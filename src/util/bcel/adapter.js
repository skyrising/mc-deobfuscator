// @flow
import util from 'util'
import { initJava, getAllClasses, dump } from './java'
import { parseClassSignature, parseFieldTypeSignature } from '../parse'
import { h2, hsig, base26, compress } from '../hash'
import { decodeClassAccessFlags, decodeMethodAccessFlags, decodeFieldAccessFlags } from '../class-reader/util'
import Interpreter from '../class-reader/interpreter'
import { lcFirst, toUnderScoreCase } from '../index'
import { parseSignature } from '../code'
import * as C from '../class-reader/constants'

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

const decoders: {[string]: (CodeLine, Code, BCELConstantPool, Array<BCELBootstrapMethod>) => any} = {
  _call (line: CodeLine, parent: Code, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>) {
    const fullSig = line.arg
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
        [util.inspect.custom]: () => line.op + ' ' + fullSig
      }
      ;((line: any): CodeLineCall).call = call
      parent.calls.push(call)
    }
  },
  invokedynamic (line: CodeLine, parent: Code, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>) {
    const match = line.arg.match(/\((\d+)\)\t00$/)
    if (match) {
      const index = +match[1]
      const cInvokeDynamic: any = expandConstant(cp, index)
      const bootMethod = bm[cInvokeDynamic.bootstrapMethodAttrIndex]
      const bootMethodRef = expandConstant(cp, bootMethod.getBootstrapMethodRef())
      const argIndexes = [...bootMethod.getBootstrapArguments()]
      const bootMethodArgs = argIndexes.map(n => expandConstant(cp, n))
      ;((line: any): CodeLineInvokeDynamic).invokeDynamic = {
        bootstrapMethod: {
          method: bootMethodRef,
          args: bootMethodArgs,
          argIndexes
        },
        name: cInvokeDynamic.nameAndType.name,
        descriptor: cInvokeDynamic.nameAndType.descriptor
      }
    }
  },
  _getfield (line: CodeLine, parent: Code, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>) {
    const match = line.arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
    if (match) {
      const [, pkg, className, fieldName, type] = match
      const field: OpField = {
        fullSig: line.arg,
        pkg,
        className,
        fieldName,
        type,
        fullClassName: pkg ? pkg + '.' + className : className,
        [util.inspect.custom]: () => line.op + ' ' + line.arg
      }
      ;((line: any): CodeLineField).field = field
      parent.fields.push(field)
    }
  },
  _putfield (line: CodeLine, parent: Code, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>) {
    const match = line.arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
    if (match) {
      const [, pkg, className, fieldName, type] = match
      const field: OpField = {
        fullSig: line.arg,
        pkg,
        className,
        fieldName,
        type,
        fullClassName: pkg ? pkg + '.' + className : className,
        [util.inspect.custom]: () => line.op + ' ' + line.arg
      }
      ;((line: any): CodeLineField).field = field
      parent.fields.push(field)
    }
  }
}
decoders.invokestatic = decoders._call
decoders.invokevirtual = decoders._call
decoders.invokespecial = decoders._call
decoders.invokeinterface = decoders._call
decoders.getfield = decoders._getfield
decoders.getstatic = decoders._getfield
decoders.putfield = decoders._putfield
decoders.putstatic = decoders._putfield

function decodeLine (l: string, parent: Code, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>): ?CodeLine {
  const match = l.match(/^(\d+):\s*([^\t]+)\s*(.*?)(?: \(\d+\))?$/)
  if (!match) return
  const [, offset, op, arg] = match
  const line: $Shape<CodeLine> = Object.create(_CodeLine)
  line.offset = +offset
  line.op = op
  line.arg = arg
  if (decoders[op]) decoders[op](line, parent, cp, bm)
  if (op === 'ldc_w' || op === 'ldc2_w' || op === 'ldc' || op === 'bipush' || op === 'sipush' || op === 'ipush') {
    const l: CodeLineLoadConst = (line: any)
    try {
      const constant = parseConst(arg)
      constant.line = l
      l.constant = constant
      l.const = constant.value
    } catch (e) {
      console.debug('cannot parse constant: %s (%s)', arg, e)
      l.constant = { type: 'unknown', value: arg }
      l.const = arg
    }
    parent.consts.push(l.const)
    parent.constants.push(l.constant)
  } else if (op.startsWith('iconst_')) {
    const l: CodeLineNumberConst = (line: any)
    l.const = +op[7]
    parent.consts.push(l.const)
    l.constant = { type: 'int', value: +op[7], line: l }
    parent.constants.push(l.constant)
  } else if (op === 'new' || op === 'instanceof') {
    (line: any).className = arg.slice(1, -1)
  } else if (op === 'tableswitch') {
    const [, defaultOffset, low, high, offsets] = (arg.match(/default = (\d+), low = (\d+), high = (\d+)\((.*)\)/): any)
    const tableswitch = {
      defaultOffset: +defaultOffset,
      low: +low,
      high: +high,
      offsets: offsets.split(', ').map(Number),
      get cases () {
        const cases = []
        const lines = []
        for (const line of parent.lines) lines[line.offset] = line
        this.offsets.forEach((off, i) => {
          cases.push({ value: this.low + i, target: lines[off] })
        })
        cases.push({ value: 'default', target: lines[this.defaultOffset] })
        return cases
      }
    }
    ;((line: any): CodeLineTableSwitch).tableswitch = tableswitch
  } else if (/^[ilfda]load_\d$/.test(op)) {
    const l: CodeLineLoad = (line: any)
    l.load = +op[6]
    l.loadType = (op[0]: any)
  } else if (/^[ilfda]load$/.test(op)) {
    const l: CodeLineLoad = (line: any)
    l.load = +arg.slice(1)
    l.loadType = (op[0]: any)
  } else if (/^[ilfda]return$/.test(op)) {
    const l: CodeLineReturn = (line: any)
    l.return = true
    l.returnType = (op[0]: any)
  }
  return (line: any)
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

function parseConst (c: string): $Shape<Constant> {
  if (/^\d+$/.test(c)) {
    const i = BigInt.asIntN(64, c)
    if (i >> BigInt(32)) return { type: 'long', value: i }
    return { type: 'int', value: Number(i) }
  }
  if (c.startsWith('<')) return { type: 'class', value: c.slice(1, -1) }
  if (c.startsWith('"')) return { type: 'string', value: JSON.parse(c) }
  return { type: 'double', value: JSON.parse(c) }
}

export async function getCode (method: BCELMethod, cp: BCELConstantPool, bm: Array<BCELBootstrapMethod>): Promise<Code> {
  const code: Code & {code: string} = {
    code: '',
    lines: [],
    calls: [],
    fields: [],
    consts: [],
    constants: [],
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
  try {
    code.code = await method.getCodeAsync().then(c => c.toStringAsync())
  } catch (error) {
    return code
  }
  code.lines = code.code.split('\n')
    .filter(l => /^\d+:/.test(l))
    .map(l => decodeLine(l, code, cp, bm))
    .filter(Boolean)
  for (let i = 0; i < code.lines.length - 1; i++) code.lines[i].next = code.lines[i + 1]
  for (let i = 1; i < code.lines.length; i++) code.lines[i].previous = code.lines[i - 1]
  return code
}

async function getClsInfo (cls: BCELClass, clsInfo: ClassInfo) {
  const { info } = clsInfo
  let hash = BigInt(1)
  clsInfo.superClassName = await cls.getSuperclassNameAsync()
  if (clsInfo.superClassName.startsWith('java')) hash = h2(hash, clsInfo.superClassName)
  info.class[clsInfo.superClassName].subClasses.add(clsInfo.obfName)
  clsInfo.interfaceNames = await cls.getInterfaceNamesAsync()
  hash = h2(hash, clsInfo.interfaceNames.map((s, i) => s.startsWith('java') ? s : i))
  for (const ifn of clsInfo.interfaceNames) info.class[ifn].subClasses.add(clsInfo.obfName)
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
    const parsedSig = parseSignature(sig)
    Object.assign((methodInfo: any), {
      bin: md,
      acc,
      flags: decodeMethodAccessFlags(acc),
      clsInfo,
      info,
      obfName: name,
      sig,
      args: await md.getArgumentTypesAsync(),
      ret: await md.getReturnTypeAsync(),
      code: await getCode(md, cp, bm),
      interpreter () {
        if (!this.attributes.Code) throw Error('No Code attribute')
        return new Interpreter(dump(this.attributes.Code).slice(6), dump(cp))
      }
    })
    await getAttributes([methodInfo, md])
    let mdHash = BigInt(1)
    methodInfo.argSigs = parsedSig.args || []
    hash = h2(hash, methodInfo.argSigs.map(hsig))
    mdHash = h2(mdHash, methodInfo.argSigs.map(hsig))
    methodInfo.retSig = parsedSig.return
    hash = h2(hash, hsig(methodInfo.retSig))
    mdHash = h2(mdHash, hsig(methodInfo.retSig))
    hash = h2(hash, methodInfo.flags.abstract)
    for (const c of methodInfo.code.consts) {
      if (typeof c === 'string') {
        if (c.length > 7) {
          hash = h2(hash, c)
          mdHash = h2(mdHash, c)
        }
        clsInfo.consts.add(c)
      } else if (typeof c === 'number') {
        hash = h2(hash, c)
        mdHash = h2(mdHash, c)
      }
    }
    methodInfo.hash = Number(compress(mdHash, BigInt(10 ** 6)))
    methodInfo.infoComplete = true
  }
  hash = h2(hash, [...clsInfo.consts])
  const fieldsByType = {}
  const visibleFieldsByType = {}
  for (const fd of await cls.getFieldsAsync()) {
    const acc = await fd.getAccessFlagsAsync()
    const fieldInfo: FieldInfo & {defaultNameIndex: number} = ({
      type: 'field',
      clsInfo,
      info,
      obfName: await fd.getNameAsync(),
      fieldType: await fd.getTypeAsync(),
      acc,
      flags: decodeFieldAccessFlags(acc),
      getDefaultName () {
        const base = getDefaultNameForFieldType(this)
        const sc = clsInfo.superClassName in info.class && info.class[clsInfo.superClassName]
        const fotis = (sc && sc.getVisibleFieldsByType && sc.getVisibleFieldsOfType(this.sig)) || []
        if (fotis.length + fieldsByType[this.sig].length > 1) {
          const index = fotis.length + this.defaultNameIndex
          const b = fieldInfo.flags.static && fieldInfo.flags.final ? toUnderScoreCase(base).toUpperCase() + '_' : base
          return b + index
        } else {
          return fieldInfo.flags.static && fieldInfo.flags.final ? toUnderScoreCase(base).toUpperCase() : base
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
    if (!fieldInfo.acc.private && !fieldInfo.acc.static) {
      const sameTypeVisible = visibleFieldsByType[fieldInfo.sig] = visibleFieldsByType[fieldInfo.sig] || []
      sameTypeVisible.push(fieldInfo)
    }
    hash = h2(hash, hsig(fieldInfo.sig))
    clsInfo.visibleFieldsOfType = function (sig) {
      const sc = clsInfo.superClassName in info.class && info.class[clsInfo.superClassName]
      if (!sc || !sc.visibleFieldsOfType) return visibleFieldsByType[sig] || []
      return [...sc.visibleFieldsOfType(sig), ...(visibleFieldsByType[sig] || [])]
    }
    clsInfo.fields[fieldInfo.obfName] = fieldInfo
  }
  clsInfo.fullHash = hash
  clsInfo.fullHashBase26 = base26(hash)
  clsInfo.hash = Number(compress(clsInfo.fullHash, BigInt(26 ** 7)))
  clsInfo.hashBase26 = base26(BigInt(clsInfo.hash))
  clsInfo.infoComplete = true
  return clsInfo
}

export async function enrichClsInfo (cls: BCELClass, info: FullInfo): Promise<ClassInfo> {
  const className = await cls.getClassNameAsync()
  const clsInfo: ClassInfo = info.class[className]
  if (clsInfo.infoComplete) return clsInfo
  return getClsInfo(cls, clsInfo)
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
    name = lcFirst(name.slice(name.lastIndexOf('.') + 1))
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

async function getAttributes (arg: [ClassInfo, BCELClass] | [FieldInfo, BCELField] | [MethodInfo, BCELMethod]) {
  const base = arg[0]
  const attributes = await arg[1].getAttributesAsync()
  const parse = ({
    field: parseFieldTypeSignature,
    class: parseClassSignature,
    method: null
  })[base.type]
  base.attributes = {}
  for (const attr of attributes) {
    const name = await attr.getNameAsync()
    base.attributes[name] = attr
    if (name === 'Signature' && parse) {
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
  info.classNames = classNames.slice(0)
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
  await forEachClass(getClsInfo)
  classNames.sort((a, b) => b.length - a.length)
  await forEachClass((cls, clsInfo) => {
    let currentName = clsInfo.obfName
    if (currentName.includes('$')) {
      const outerName = currentName.slice(0, currentName.lastIndexOf('$'))
      if (outerName in clsInfo.info.class) {
        const outerClass = clsInfo.info.class[outerName]
        outerClass.fullHash = h2(outerClass.fullHash, clsInfo.fullHash)
        outerClass.fullHashBase26 = base26(outerClass.fullHash)
        outerClass.hash = Number(compress(outerClass.fullHash, BigInt(26 ** 7)))
        outerClass.hashBase26 = base26(BigInt(outerClass.hash))
      }
    }
  })
  info.enriched = true
}
