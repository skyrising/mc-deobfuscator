// @flow

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.obfName === 'main') {
    const initCall = code.calls[code.calls.length - 1]
    info.class[initCall.fullClassName].name = 'net.minecraft.client.MinecraftClient'
  } else if (methodInfo.sig === '(Ljava/lang/String;)Z') {
    methodInfo.name = 'isNonEmptyString'
  }
}
