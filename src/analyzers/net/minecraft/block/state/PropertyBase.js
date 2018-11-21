// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'name'
    case 'Ljava/lang/Class;': return 'type'
    case 'Ljava/lang/Integer;': return 'hash'
  }
}

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '()I': return methodInfo.obfName === 'hashCode' ? 'hashCode' : 'computeHash'
  }
}
