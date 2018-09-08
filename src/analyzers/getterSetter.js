// @flow
export const generic = true
export const name = 'getters & setters'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.origName.length > 3) return
  return nameGetterSetter(methodInfo)
}

export function nameGetterSetter (methodInfo: MethodInfo) {
  if (methodInfo.origName.length > 3) return methodInfo.origName
  const { code, clsInfo } = methodInfo
  if (code.lines.length === 3 && code.lines[0].op === 'aload_0' && code.lines[1].op === 'getfield') {
    const field = code.lines[1].field
    if (field.fullClassName === clsInfo.obfName && clsInfo.fields[field.fieldName]) {
      const fieldName = clsInfo.fields[field.fieldName].name || field.fieldName
      const prefix = field.type === 'Z' ? 'is' : 'get'
      if (/^[A-Z]/.test(fieldName)) return prefix + '_' + fieldName
      return prefix + fieldName[0].toUpperCase() + fieldName.slice(1)
    }
  } else if (code.lines.length === 4 && code.lines[0].op === 'aload_0' && code.lines[2].op === 'putfield') {
    const field = code.lines[2].field
    if (field.fullClassName === clsInfo.obfName && clsInfo.fields[field.fieldName]) {
      const fieldName = clsInfo.fields[field.fieldName].name || field.fieldName
      if (/^[A-Z]/.test(fieldName)) return 'set_' + fieldName
      return 'set' + fieldName[0].toUpperCase() + fieldName.slice(1)
    }
  }
}
