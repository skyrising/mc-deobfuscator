
export function field (fieldInfo) {
  const {sig} = fieldInfo
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
