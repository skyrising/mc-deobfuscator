// @flow
export const generic = true
export const name = 'getters & setters'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.origName.length > 3) return
  return nameGetterSetter(methodInfo)
}

function nameAccessor (methodInfo: MethodInfo, fieldInfo: FieldInfo, type: 'get' | 'set') {
  const prefix = type === 'get' && fieldInfo.sig === 'Z' ? 'is' : type
  const name = fieldInfo.name || fieldInfo.obfName
  if (/^[A-Z]/.test(name)) return prefix + '_' + name
  return prefix + name[0].toUpperCase() + name.slice(1)
}

export function nameGetterSetter (methodInfo: MethodInfo) {
  if (methodInfo.origName.length > 3) return methodInfo.origName
  const { sig, code, clsInfo } = methodInfo
  const { lines } = code
  if (methodInfo.getter === true || (methodInfo.getter !== false && sig.startsWith('()') && lines.length === 3 && lines[0].op === 'aload_0' && lines[1].op === 'getfield')) {
    const getfield = lines[0].nextOp('getfield', true)
    if (!getfield) return
    const fieldInfo = clsInfo.fields[getfield.field.fieldName]
    return fieldInfo && nameAccessor(methodInfo, fieldInfo, 'get')
  }
  if (methodInfo.getter) return nameAccessor(methodInfo, methodInfo.getter, 'get')
  if (methodInfo.setter === true || (methodInfo.setter !== false && (lines.length === 4 || (lines.length === 5 && lines[3].op === 'aload_0')) && lines[0].op === 'aload_0' && lines[2].op === 'putfield')) {
    const getfield = lines[0].nextOp('putfield', true)
    if (!getfield) return
    const fieldInfo = clsInfo.fields[getfield.field.fieldName]
    return fieldInfo && nameAccessor(methodInfo, fieldInfo, 'set')
  }
}
