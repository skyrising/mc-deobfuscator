// @flow

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.origName === 'main') {
    const initCall = code.internalCalls[code.internalCalls.length - 1]
    info.class[initCall.fullClassName].name = 'net.minecraft.client.MinecraftClient'
  } else if (methodInfo.sig === '(Ljava/lang/String;)Z') {
    methodInfo.name = 'isNonEmptyString'
  }
}
