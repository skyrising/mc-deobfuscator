// @flow
export const generic = true
export const name = 'getters & setters'

function nameAccessor (methodInfo: MethodInfo, fieldInfo: FieldInfo, type: 'get' | 'set') {
  const prefix = type === 'get' && fieldInfo.sig === 'Z' ? 'is' : type
  const name = fieldInfo.accessorSuffix || fieldInfo.bestName
  if (/^[A-Z]/.test(name)) return prefix + '_' + name
  return prefix + name[0].toUpperCase() + name.slice(1)
}

const GETTER_PREDICATE = methodInfo => methodInfo.code.matches([
  'aload_0',
  'getfield',
  /^.return$/
])

const GETTER_SUPPLIER_PREDICATE = methodInfo => (methodInfo.code.matches([
  'aload_0',
  'getfield',
  line => line.op === 'invokeinterface' && line.arg.startsWith('java.util.function.Supplier.get:()Ljava/lang/Object;'),
  'checkcast',
  /^.return$/
]))

const IS_GETTER = methodInfo => methodInfo.getter === true || (methodInfo.getter !== false && (
  GETTER_PREDICATE(methodInfo) || GETTER_SUPPLIER_PREDICATE(methodInfo)
))

const SETTER_PREDICATE = methodInfo => methodInfo.argSigs.length === 1 && methodInfo.code.matches([
  'aload_0',
  /^.load_1$/,
  'putfield',
  'return'
])

const SETTER_THIS_PREDICATE = methodInfo => methodInfo.argSigs.length === 1 && methodInfo.code.matches([
  'aload_0',
  /^.load_1$/,
  'putfield',
  'aload_0',
  'areturn'
])

const IS_SETTER = methodInfo => methodInfo.setter === true || (methodInfo.setter !== false && (
  SETTER_PREDICATE(methodInfo) || SETTER_THIS_PREDICATE(methodInfo)
))

const IS_BRIDGE = methodInfo => {
  if (!methodInfo.flags.synthetic || methodInfo.code.calls.length !== 1) return false
  let phase = 'load'
  for (const line of methodInfo.code.lines) {
    if (phase === 'load' && (line.loadType || line.op === 'checkcast')) continue
    if (phase === 'load' && line.call) {
      phase = 'call'
      continue
    }
    if (phase === 'call' && line.return) return !line.next
    return false
  }
  return false
}

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo } = methodInfo
  const { lines } = code
  if (IS_BRIDGE(methodInfo)) {
    const targetCall = methodInfo.code.calls[0]
    const target = clsInfo.method[targetCall.methodName + ':' + targetCall.signature]
    console.debug(`${clsInfo.name || clsInfo.obfName}.${methodInfo.obfName}${methodInfo.sig} is bridge to ${target.obfName}${target.sig}`)
    if (methodInfo.flags.static && target.flags.private) { // accessor for private method
      methodInfo.depends = () => `access$${target.bestName}`
    } else { // generic bridge
      target.depends = methodInfo
    }
    return
  }
  if (methodInfo.obfName.length > 3 || methodInfo.code.error) return methodInfo.obfName
  if (IS_GETTER(methodInfo)) {
    console.debug(`${clsInfo.name || clsInfo.obfName}.${methodInfo.obfName}${methodInfo.sig} is getter`)
    const getfield = lines[0].nextOp('getfield', true)
    if (!getfield) return
    const fieldInfo = clsInfo.fields[getfield.field.fieldName]
    return fieldInfo && nameAccessor(methodInfo, fieldInfo, 'get')
  }
  if (methodInfo.getter) return nameAccessor(methodInfo, methodInfo.getter, 'get')
  if (IS_SETTER(methodInfo)) {
    console.debug(`${clsInfo.name || clsInfo.obfName}.${methodInfo.obfName}${methodInfo.sig} is setter`)
    const getfield = lines[0].nextOp('putfield', true)
    if (!getfield) return
    const fieldInfo = clsInfo.fields[getfield.field.fieldName]
    return fieldInfo && nameAccessor(methodInfo, fieldInfo, 'set')
  }
}
