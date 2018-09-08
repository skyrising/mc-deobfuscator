// @flow
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  const name = methodInfo.origName
  if (name !== 'main' && name !== '<clinit>') {
    if (methodInfo.retSig !== 'V') info.class[methodInfo.retSig.slice(1, -1)].name = CLASS.DATA_GENERATOR
  }
}
