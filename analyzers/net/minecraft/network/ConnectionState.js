import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const ConnectionState = cls.getClassName()
  if (sig.endsWith(')Ljava/lang/Integer;')) {
    info.class[method.getArgumentTypes()[1].getClassName()].name = CLASS.PACKET
    return 'getPacketId'
  }
  if (sig.endsWith('L' + ConnectionState + ';') && method.isStatic()) return 'get'
  if (sig === '()I') return 'getId'
}
