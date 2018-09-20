// @flow

export function method (methodInfo: MethodInfo) {
  const { code } = methodInfo
  if (methodInfo.retSig === 'Ljava/util/UUID;') return 'getRandomUUID'
  if (code.consts.includes('Something went wrong when converting from HSV to RGB. Input was ')) return 'hsv2rgb'
  if (methodInfo.sig === '(D)D' && code.consts.includes(BigInt('6910469410427058090'))) return 'fastInvSqrt'
}
