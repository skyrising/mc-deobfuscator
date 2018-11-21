// @flow

import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Z': return 'fallsInstantly'
  }
}

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (code.lines.length === 2 && code.lines[0].op === 'iconst_2' && code.lines[1].op === 'ireturn') {
    return 'getTickDelay'
  }
  const { sig } = methodInfo
  if (methodInfo.flags.static && sig.endsWith(')Z')) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.BLOCK_STATE
    return 'canFallThrough'
  }
}
