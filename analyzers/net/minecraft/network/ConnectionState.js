import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const ConnectionState = cls.getClassName()
  if (sig.endsWith(')Ljava/lang/Integer;')) {
    info.class[methodInfo.args[1].getClassName()].name = CLASS.PACKET
    return 'getPacketId'
  }
  if (sig.endsWith('L' + ConnectionState + ';') && methodInfo.static) return 'get'
  if (sig === '()I') return 'getId'
}
