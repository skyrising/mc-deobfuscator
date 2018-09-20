// @flow

const FIELD_REF_REGEX = /^(?:, )?(.*?): $/

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo } = methodInfo
  switch (methodInfo.sig) {
    case '(I)[I': return 'alloc'
    case '()V': return 'free'
    case '()Ljava/lang/String;': {
      for (const line of code.lines) {
        if (typeof line.const !== 'string') continue
        const match = line.const.match(FIELD_REF_REGEX)
        if (!match) continue
        const getfield = line.nextOp('getfield')
        if (!getfield) continue
        clsInfo.fields[getfield.field.fieldName].name = match[1]
      }
      return 'getInfo'
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'I': return 'largeArraySize'
  }
}
