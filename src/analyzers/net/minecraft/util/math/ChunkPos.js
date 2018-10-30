// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(II)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'xz'[line.load - 1]
    }
  } else if (methodInfo.origName === '<init>' && methodInfo.argSigs.length === 1 && sig !== 'J') {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.BLOCK_POS
  }
}
