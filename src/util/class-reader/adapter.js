import fs from 'fs'
import util from 'util'
import { readClasses } from './index'
import { dot, v } from '../index'
import { parseSignature, makeCode, makeCodeLine } from '../code'
import { decodeClassAccessFlags, decodeMethodAccessFlags } from './util'
import { h2, hsig, base26, compress } from '../hash'
import { parseClassSignature, parseFieldTypeSignature } from '../parse'
import * as C from './constants'

function decodeLine (l, cp, bm) {
  const line = makeCodeLine(l)
  switch (line.opId) {
    case C.OP_INVOKEVIRTUAL: case C.OP_INVOKESTATIC: case C.OP_INVOKESPECIAL: case C.OP_INVOKEINTERFACE: {
      const fullClassName = dot(v(line.method.class))
      const methodName = v(line.method.nameAndType.name)
      const signature = v(line.method.nameAndType.descriptor)
      const fullSig = fullClassName + '.' + methodName + ':' + signature
      line.call = {
        fullSig,
        pkg: fullClassName.includes('.') ? fullClassName.slice(0, fullClassName.lastIndexOf('.')) : '',
        className: fullClassName.slice(fullClassName.lastIndexOf('.') + 1),
        methodName,
        fullClassName,
        [util.inspect.custom]: () => line.op + ' ' + fullSig
      }
      break
    }
    case C.OP_INVOKEDYNAMIC: {
      const bootstrapMethod = bm[line.method.bootstrapMethodAttrIndex]
      line.invokeDynamic = {
        bootstrapMethod: {
          method: bootstrapMethod.ref,
          args: bootstrapMethod.arguments
        },
        name: v(line.method.nameAndType.name),
        descriptor: v(line.method.nameAndType.descriptor)
      }
    }
  }
  if (line.const) {
    line.constant = convertConstant(line.const)
    line.constant.line = line
    line.const = line.constant.value
  }
  if (line.field) {
    const f = line.field
    f.fullClassName = dot(v(f.class))
    f.fieldName = v(f.nameAndType.name)
    f.type = v(f.nameAndType.descriptor)
    f.pkg = f.fullClassName.slice(0, f.fullClassName.indexOf('.') + 1)
    f.className = f.fullClassName.slice(f.pkg.length)
    if (f.pkg) f.pkg = f.pkg.slice(0, f.pkg.length - 1)
  }
  return line
}

function convertConstant (c) {
  switch (c.type) {
    case C.CONSTANT_Utf8: return { type: 'string', value: v(c) }
    case C.CONSTANT_Class: return { type: 'class', value: v(c) }
    case C.CONSTANT_String: return { type: 'string', value: v(c) }
    case C.CONSTANT_Long: return { type: 'long', value: v(c) }
    case C.CONSTANT_Integer: return { type: 'int', value: v(c) }
    case C.CONSTANT_Float: return { type: 'float', value: v(c) }
    case C.CONSTANT_Double: return { type: 'double', value: v(c) }
  }
  return c
}

function getCode (md, cp, bm) {
  if (!md.code) return makeCode([])
  const lines = md.code.lines.map(line => decodeLine(line, cp, bm))
  return makeCode(lines)
}

function getClsInfo (info: FullInfo, cf) {
  let hash = BigInt(1)
  const name = dot(cf.className)
  const clsInfo = info.class[name]
  clsInfo.superClassName = dot(cf.superClassName)
  if (clsInfo.superClassName.startsWith('java')) hash = h2(hash, clsInfo.superClassName)
  info.class[clsInfo.superClassName].subClasses.add(clsInfo.obfName)
  clsInfo.interfaceNames = cf.interfaceNames
  hash = h2(hash, clsInfo.interfaceNames.map((s, i) => s.startsWith('java') ? s : i))
  for (const ifn of clsInfo.interfaceNames) info.class[ifn].subClasses.add(clsInfo.obfName)
  clsInfo.flags = decodeClassAccessFlags(cf.accessFlags)
  hash = h2(hash, clsInfo.flags.abstract)
  hash = h2(hash, clsInfo.flags.interface)
  
  for (const attr of cf.attributes) {
    clsInfo.attributes[attr.name] = attr
    if (attr.name === 'Signature') {
      clsInfo.rawGenericSignature = attr.value.value
      Object.defineProperty(clsInfo, 'genericSignature', {
        get () {
          if (!this._genericSignature) this._genericSignature = parseClassSignature(this.rawGenericSignature)[0]
          return this._genericSignature
        }
      })
    }
  }
  
  const cp = cf.constantPool
  const bm = cf.bootstrapMethods || []
  
  for (const md of cf.methods) {
    const methodInfo = clsInfo.method[md.name + ':' + md.descriptor]
    hash = h2(hash, md.accessFlags)
    const parsedSig = parseSignature(md.descriptor)
    methodInfo.attributes = {}
    for (const attr of md.attributes) {
      methodInfo.attributes[attr.name] = attr
    }
    Object.assign((methodInfo: any), {
      acc: md.accessFlags,
      flags: decodeMethodAccessFlags(md.accessFlags),
      clsInfo,
      info,
      obfName: md.name,
      sig: md.descriptor,
      code: getCode(md, cp, bm),
      interpreter () {
        if (!this.attributes.Code) throw Error('No Code attribute')
        return new Interpreter(this.attributes.Code.slice(6), cp)
      }
    })
    let mdHash = BigInt(1)
    methodInfo.argSigs = parsedSig.args || []
    hash = h2(hash, methodInfo.argSigs.map(hsig))
    mdHash = h2(mdHash, methodInfo.argSigs.map(hsig))
    methodInfo.retSig = parsedSig.return
    hash = h2(hash, hsig(methodInfo.retSig))
    mdHash = h2(mdHash, hsig(methodInfo.retSig))
    hash = h2(hash, methodInfo.flags.abstract)
    for (const constant of methodInfo.code.constants) {
      if (constant.type === 'class') continue
      const c = constant.value
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
  for (const fd of cf.fields) {
    const fieldInfo = info.newField(clsInfo.obfName, fd.name, fd.descriptor, fd.accessFlags)
    hash = h2(hash, fieldInfo.acc)
    const sameType = fieldsByType[fieldInfo.sig] = fieldsByType[fieldInfo.sig] || []
    fieldInfo.defaultNameIndex = sameType.length
    sameType.push(fieldInfo)
    if (!fieldInfo.acc.private && !fieldInfo.acc.static) {
      const sameTypeVisible = visibleFieldsByType[fieldInfo.sig] = visibleFieldsByType[fieldInfo.sig] || []
      sameTypeVisible.push(fieldInfo)
    }
    hash = h2(hash, hsig(fieldInfo.sig))
    fieldInfo.attributes = {}
    for (const attr of fd.attributes) {
      fieldInfo.attributes[attr.name] = attr
      if (attr.name === 'Signature') {
        fieldInfo.rawGenericSignature = attr.value.value
        Object.defineProperty(fieldInfo, 'genericSignature', {
          get () {
            if (!this._genericSignature) this._genericSignature = parseFieldTypeSignature(this.rawGenericSignature)[0]
            return this._genericSignature
          }
        })
      }
    }
    clsInfo.fields[fieldInfo.obfName] = fieldInfo
  }
  clsInfo.fieldsByType = fieldsByType
  clsInfo.visibleFieldsOfType = function (sig) {
    const sc = clsInfo.superClassName in info.class && info.class[clsInfo.superClassName]
    if (!sc || !sc.visibleFieldsOfType) return visibleFieldsByType[sig] || []
    return [...sc.visibleFieldsOfType(sig), ...(visibleFieldsByType[sig] || [])]
  }
  clsInfo.fullHash = hash
  clsInfo.fullHashBase26 = base26(hash)
  clsInfo.hash = Number(compress(clsInfo.fullHash, BigInt(26 ** 7)))
  clsInfo.hashBase26 = base26(BigInt(clsInfo.hash))
  clsInfo.infoComplete = true
  return clsInfo
}

const isMinecraftClass = ({className}) => !className.includes('/') || className.startsWith('net/minecraft')

export async function readAllClasses (info: FullInfo) {
  const classNames = []
  await readClasses(fs.createReadStream(info.jarFile))
    .filter(cf => isMinecraftClass(cf))
    .map(cf => getClsInfo(info, cf))
    .forEach(clsInfo => {
      classNames.push(clsInfo.obfName)
      if (info.currentPass) info.currentPass.analyzed++
    })
  info.classNames = classNames.slice(0)
  classNames.sort((a, b) => b.length - a.length)
  for (const currentName of classNames) {
    const clsInfo = info.class[currentName]
    if (currentName.includes('$')) {
      const outerName = currentName.slice(0, currentName.lastIndexOf('$'))
      if (outerName in clsInfo.info.class) {
        const outerClass = clsInfo.info.class[outerName]
        outerClass.fullHash = h2(outerClass.fullHash, clsInfo.fullHash)
        outerClass.fullHashBase26 = base26(outerClass.fullHash)
        outerClass.hash = Number(compress(outerClass.fullHash, BigInt(26 ** 7)))
        outerClass.hashBase26 = base26(BigInt(outerClass.hash))
        outerClass.innerClasses.add(clsInfo)
      }
    }
  }
  info.enriched = true
}
