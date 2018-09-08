// @flow
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const info = methodInfo.clsInfo.info
  for (const c of methodInfo.code.consts) {
    if (c === 'Unexpected hello packet') {
      info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.PACKET_LOGIN_HELLO
      return 'onHelloPacket'
    }
    if (c === 'Unexpected key packet') {
      info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.PACKET_LOGIN_KEY
      return 'onKeyPacket'
    }
    if (c === 'Disconnecting {}: {}') return 'disconnect'
  }
}
