// @flow

export function method (methodInfo: MethodInfo) {
  if (methodInfo.code.consts.includes('No default key')) return 'getDefaultKey'
  if (methodInfo.code.consts.includes('No default value')) return 'getDefaultValue'
}
