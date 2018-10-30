// @flow

export function method (methodInfo: MethodInfo) {
  if (methodInfo.sig === '()V') return 'tick'
}
