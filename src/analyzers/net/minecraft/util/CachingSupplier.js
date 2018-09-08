// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/function/Supplier;': return 'supplier'
    case 'Ljava/lang/Object;': return 'cache'
  }
}

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '()Ljava/lang/Object;': return 'get'
  }
}
