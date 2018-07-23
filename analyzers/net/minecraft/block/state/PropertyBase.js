export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/lang/String;': return 'name'
    case 'Ljava/lang/Class;': return 'type'
    case 'Ljava/lang/Integer;': return 'hash'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  switch (methodInfo.sig) {
    case '()I': return methodInfo.obfName === 'hashCode' ? 'hashCode' : 'computeHash'
  }
}
