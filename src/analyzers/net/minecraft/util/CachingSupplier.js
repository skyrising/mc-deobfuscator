
export function field (fieldInfo) {
  const {sig} = fieldInfo
  switch (sig) {
    case 'Ljava/util/function/Supplier;': return 'supplier'
    case 'Ljava/lang/Object;': return 'cache'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  switch (sig) {
    case '()Ljava/lang/Object;': return 'get'
  }
}
