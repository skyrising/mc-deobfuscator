// @flow

export function method (methodInfo: MethodInfo) {
  const {sig, code} = methodInfo
  if (methodInfo.origName === '<init>') return
  switch (sig) {
    case '(Ljava/util/function/Supplier;)V': return 'start'
    case '()V': return 'end'
    case '(Ljava/lang/String;)Ljava/util/List;': return 'getProfilingData'
  }
  if (code.consts.includes('[UNKNOWN]')) return 'getLastSectionName'
}
