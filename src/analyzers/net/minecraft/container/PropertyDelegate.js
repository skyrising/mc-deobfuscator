// @flow

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '(I)I': return 'get'
    case '(II)V': return 'set'
    case '()I': return 'size'
  }
}
