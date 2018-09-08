// @flow

import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    const newCls = code.lines[0].nextOp('new', true)
    if (newCls && newCls.className && newCls.className.startsWith(clsInfo.obfName + '$')) info.class[newCls.className].name = CLASS.MATERIAL$BUILDER
  }
}

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.MAP_COLOR}`.matches(fieldInfo)) return 'mapColor'
  if (s`${CLASS.PISTON_BEHAVIOR}`.matches(fieldInfo)) return 'pistonBehavior'
}
