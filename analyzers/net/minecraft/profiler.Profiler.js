export function cls (cls, clsInfo, info) {
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (methodInfo.origName === '<init>') return
  const {sig} = methodInfo
  switch (sig) {
    case '(Ljava/util/function/Supplier;)V': return 'start'
    case '()V': return 'end'
    case '(Ljava/lang/String;)Ljava/util/List;': return 'getProfilingData'
  }
  if (code.consts.includes('[UNKNOWN]')) return 'getLastSectionName'
}
