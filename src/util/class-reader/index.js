import util from 'util'
import PushStream from 'zen-push'
import * as io from '../buffer'
import { getClasses } from './jar'
import { parseCode } from './code'
import { errorCause } from '..'
import * as C from './constants'

/*
ClassFile {
    u4             magic;
    u2             minor_version;
    u2             major_version;
    u2             constant_pool_count;
    cp_info        constant_pool[constant_pool_count-1];
    u2             access_flags;
    u2             this_class;
    u2             super_class;
    u2             interfaces_count;
    u2             interfaces[interfaces_count];
    u2             fields_count;
    field_info     fields[fields_count];
    u2             methods_count;
    method_info    methods[methods_count];
    u2             attributes_count;
    attribute_info attributes[attributes_count];
}
*/

export function readClass (buf: Buffer, name?: string) {
  const pb = { offset: 0, buf }
  const cf = {}
  try {
    cf.magic = io.rb32(pb, 'magic')
    if (cf.magic !== 0xcafebabe) throw Error(`Invalid signature 0x${cf.magic.toString(16)}`)
    cf.minorVersion = io.rb16(pb, 'major_version')
    cf.majorVersion = io.rb16(pb, 'minor_version')
    if (cf.majorVersion > 55 || (cf.majorVersion === 55 && cf.minorVersion > 0)) {
      throw Error(`Unsupported class file version ${cf.majorVersion}.${cf.minorVersion} > 55.0`)
    }
    const cp = readConstantPool(pb)
    cf.constantPool = cp
    /*
    if (name === 'crk.class') {
      for (const e of cf.constantPool) console.log(util.inspect(e, { customInspect: false }))
      console.log(io.error(pb, ''))
    }
    */
    cf.accessFlags = io.rb16(pb)
    cf.thisClass = cp[cf.thisIndex = io.rb16(pb)]
    cf.className = cf.thisClass.value.value
    cf.superClass = cp[cf.superIndex = io.rb16(pb)]
    cf.superClassName = cf.superClass ? cf.superClass.value.value : null
    cf.interfacesCount = io.rb16(pb)
    cf.interfaces = []
    cf.interfaceNames = []
    for (let i = 0; i < cf.interfacesCount; i++) {
      const ifc = cp[io.rb16(pb)]
      cf.interfaces.push(ifc)
      cf.interfaceNames.push(ifc.value.value)
    }
    cf.fieldsCount = io.rb16(pb)
    cf.fields = []
    for (let i = 0; i < cf.fieldsCount; i++) cf.fields.push(readFieldOrMethod(pb, cp))
    cf.methodsCount = io.rb16(pb)
    cf.methods = []
    for (let i = 0; i < cf.methodsCount; i++) cf.methods.push(readFieldOrMethod(pb, cp))
    cf.attributesCount = io.rb16(pb)
    cf.attributes = []
    for (let i = 0; i < cf.attributesCount; i++) cf.attributes.push(readAttribute(pb, cp, cf))
  } catch (e) {
    const msg = cf.className || name ? 'Error parsing class ' + (cf.className || name) : 'Error parsing class'
    const info = 'cf: ' + util.inspect(cf, { customInspect: false })
    throw errorCause(io.error(pb, msg + '\n' + info), e)
  }
  return cf
}

export function readConstantPool (pb) {
  const count = io.rb16(pb, 'constant_pool_count')
  const cp = new Proxy(Array(count), {
    get (base, key) {
      if (typeof key === 'number' && (key < 0 || key >= count)) throw Error('Out of bounds: ' + key)
      return base[key]
    }
  })
  cp[0] = null
  for (let i = 1; i < count; i++) {
    try {
      io.start(pb, `cp[${i}]`)
      const entry = { index: i, ...readConstantPoolEntry(pb) }
      cp[i] = entry
      if (entry.type === C.CONSTANT_Long || entry.type === C.CONSTANT_Double) {
        cp[++i] = entry
      }
      io.end(pb)
    } catch (e) {
      throw errorCause(new Error(`Cannot read cp[${i}], previous: ${util.inspect(cp[i - 1], { customInspect: false })}`), e)
    }
  }
  return cp.map(e => e && refConstantPoolEntry(e, cp))
}

function readConstantPoolEntry (pb) {
  const c = { type: io.r8(pb, 'type') }
  switch (c.type) {
    case C.CONSTANT_Utf8: {
      c.length = io.rb16(pb, 'length')
      c.value = io.bytes(pb, c.length, 'value').toString('utf8')
      c[util.inspect.custom] = (depth, opts) => util.inspect(c.value, opts)
      break
    }
    case C.CONSTANT_Integer: {
      c.value = io.rsb(pb, 32, 'value')
      break
    }
    case C.CONSTANT_Float: {
      c.value = io.rf32(pb, 'value')
      break
    }
    case C.CONSTANT_Long: {
      c.value = io.rsb64(pb, 'value')
      break
    }
    case C.CONSTANT_Double: {
      c.value = io.rf64(pb, 'value')
      break
    }
    case C.CONSTANT_Class: case C.CONSTANT_String: {
      c.valueIndex = io.rb16(pb, 'valueIndex')
      break
    }
    case C.CONSTANT_Fieldref: case C.CONSTANT_Methodref: case C.CONSTANT_InterfaceMethodref: {
      c.classIndex = io.rb16(pb, 'classIndex')
      c.nameAndTypeIndex = io.rb16(pb, 'nameAndTypeIndex')
      break
    }
    case C.CONSTANT_NameAndType: {
      c.nameIndex = io.rb16(pb, 'nameIndex')
      c.descriptorIndex = io.rb16(pb, 'descriptorIndex')
      break
    }
    case C.CONSTANT_MethodHandle: {
      c.refKind = io.r8(pb, 'refKind')
      c.refIndex = io.rb16(pb, 'refIndex')
      break
    }
    case C.CONSTANT_MethodType: {
      c.descriptorIndex = io.rb16(pb, 'descriptorIndex')
      break
    }
    case C.CONSTANT_Dynamic: case C.CONSTANT_InvokeDynamic: {
      c.bootstrapMethodAttrIndex = io.rb16(pb, 'bootstrapMethodAttrIndex')
      c.nameAndTypeIndex = io.rb16(pb, 'nameAndTypeIndex')
      break
    }
    case C.CONSTANT_Module: case C.CONSTANT_Package: {
      c.nameIndex = io.rb16(pb, 'nameIndex')
      break
    }
    default: {
      pb.offset--
      throw io.error(pb, 'Unknown constant type ' + c.type)
    }
  }
  return c
}

function refConstantPoolEntry (c, cp) {
  switch (c.type) {
    case C.CONSTANT_Class: {
      c.value = cp[c.valueIndex]
      c[util.inspect.custom] = (depth, opts) => '<' + c.value.value + '>'
      break
    }
    case C.CONSTANT_String: {
      c.value = cp[c.valueIndex]
      c[util.inspect.custom] = (depth, opts) => '"' + c.value.value + '"'
      break
    }
    case C.CONSTANT_Fieldref: case C.CONSTANT_Methodref: case C.CONSTANT_InterfaceMethodref: {
      c.class = cp[c.classIndex]
      c.nameAndType = cp[c.nameAndTypeIndex]
      c[util.inspect.custom] = () => c.class.value.value + '.' + c.nameAndType.name.value + ':' + c.nameAndType.descriptor.value
      break
    }
    case C.CONSTANT_NameAndType: {
      c.name = cp[c.nameIndex]
      c.descriptor = cp[c.descriptorIndex]
      c[util.inspect.custom] = () => c.name.value + ':' + c.descriptor.value
      break
    }
    case C.CONSTANT_MethodHandle: {
      c.ref = cp[c.refIndex]
      c[util.inspect.custom] = (depth, opts) => '&' + util.inspect(c.ref, opts)
      break
    }
    case C.CONSTANT_MethodType: {
      c.descriptor = cp[c.descriptorIndex]
      c[util.inspect.custom] = () => c.descriptor.value
      break
    }
    case C.CONSTANT_InvokeDynamic: {
      // c.bootstrapMethodAttr = cp[c.bootstrapMethodAttrIndex]
      c.nameAndType = cp[c.nameAndTypeIndex]
      break
    }
    case C.CONSTANT_Module: case C.CONSTANT_Package: {
      c.name = cp[c.nameIndex]
      c[util.inspect.custom] = () => c.type === (C.CONSTANT_Module ? 'module ' : 'package ') + c.name.value
      break
    }
  }
  return c
}

/*
field_info {
    u2             access_flags;
    u2             name_index;
    u2             descriptor_index;
    u2             attributes_count;
    attribute_info attributes[attributes_count];
}
*/

function readFieldOrMethod (pb, cp) {
  const fom = {}
  fom.accessFlags = io.rb16(pb)
  fom.name = cp[io.rb16(pb)].value
  fom.descriptor = cp[io.rb16(pb)].value
  const attrCount = io.rb16(pb)
  fom.attributes = []
  for (let i = 0; i < attrCount; i++) fom.attributes.push(readAttribute(pb, cp, fom))
  return fom
}

/*
attribute_info {
    u2 attribute_name_index;
    u4 attribute_length;
    u1 info[attribute_length];
}
*/

export function readAttribute (pb, cp, tgt) {
  const attr = {
    name: cp[io.rb16(pb)].value,
    size: io.rb32(pb)
  }
  if (!io.has(pb, attr.size)) throw io.error(pb, `Cannot read attribute value: expected ${attr.size} bytes but there are only ${io.has(pb)} left`)
  attr.info = io.bytes(pb, attr.size)
  switch (attr.name) {
    case 'Code': {
      try {
        attr.value = parseCode(attr.info, cp)
      } catch (e) {
        throw errorCause(new Error(`Cannot parse ${tgt.name}:${tgt.descriptor}.Code`), e)
      }
      break
    }
    case 'SourceFile':
    case 'Signature': {
      attr.value = cp[attr.info.readUInt16BE(0)]
      break
    }
    case 'BootstrapMethods': {
      let offset = 0
      const num = attr.info.readUInt16BE(offset)
      offset += 2
      const bms = []
      for (let i = 0; i < num; i++) {
        const bm = {
          ref: cp[attr.info.readUInt16BE(offset)],
          arguments: []
        }
        offset += 2
        const numArgs = attr.info.readUInt16BE(offset)
        offset += 2
        for (let j = 0; j < numArgs; j++) {
          bm.arguments.push(cp[attr.info.readUInt16BE(offset)])
          offset += 2
        }
        bms.push(bm)
      }
      attr.value = bms
      break
    }
  }
  if (tgt && attr.value) {
    tgt[attr.name[0].toLowerCase() + attr.name.slice(1)] = attr.value
  }
  return attr
}

export function readClasses (readable) {
  const ps = new PushStream()
  getClasses(readable).subscribe({
    async next (entry) {
      try {
        ps.next(readClass(await entry.getBytes(), entry.filename))
      } catch (e) {
        ps.error(e)
      }
    },
    error: e => ps.error(e),
    complete: () => ps.complete()
  })
  return ps.observable
}
