// @flow
export const generic = true
export const name = 'getters & setters'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.origName.length > 3) return
  return nameGetterSetter(methodInfo)
}

export function nameGetterSetter (methodInfo: MethodInfo) {
  if (methodInfo.origName.length > 3) return methodInfo.origName
  const { sig, code, clsInfo } = methodInfo
  const { lines } = code
  if (sig.startsWith('()') && lines.length === 3 && lines[0].op === 'aload_0' && lines[1].op === 'getfield') {
    const field = lines[1].field
    if (field.fullClassName === clsInfo.obfName && clsInfo.fields[field.fieldName]) {
      const fieldName = clsInfo.fields[field.fieldName].name || field.fieldName
      const prefix = field.type === 'Z' ? 'is' : 'get'
      if (/^[A-Z]/.test(fieldName)) return prefix + '_' + fieldName
      return prefix + fieldName[0].toUpperCase() + fieldName.slice(1)
    }
  } else if (lines.length === 4 && lines[0].op === 'aload_0' && lines[2].op === 'putfield') {
    const field = lines[2].field
    if (field.fullClassName === clsInfo.obfName && clsInfo.fields[field.fieldName]) {
      const fieldName = clsInfo.fields[field.fieldName].name || field.fieldName
      if (/^[A-Z]/.test(fieldName)) return 'set_' + fieldName
      return 'set' + fieldName[0].toUpperCase() + fieldName.slice(1)
    }
  }
}
