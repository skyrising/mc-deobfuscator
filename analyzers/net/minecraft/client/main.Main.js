export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (method.getName() === 'main') {
    const initCall = code.internalCalls[code.internalCalls.length - 1]
    info.class[initCall.fullClassName].name = 'net.minecraft.client.MinecraftClient'
  } else if (method.getSignature() === '(Ljava/lang/String;)Z') {
    methodInfo.name = 'isNonEmptyString'
  }
}
