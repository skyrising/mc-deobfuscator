export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/function/Supplier;': return 'supplier'
    case 'Ljava/lang/Object;': return 'cache'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  switch (sig) {
    case '()Ljava/lang/Object;': return 'get'
  }
}
