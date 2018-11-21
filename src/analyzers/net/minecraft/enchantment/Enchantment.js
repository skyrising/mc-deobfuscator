// @flow

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '(I)I': return methodInfo.code.calls.length ? 'getMaxEnchantability' : 'getMinEnchantability'
  }
}
