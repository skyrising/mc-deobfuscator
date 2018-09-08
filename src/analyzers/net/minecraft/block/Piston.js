// @flow

import { signatureTag as s, getMethodInheritance } from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo, info } = fieldInfo
  switch (sig) {
    case 'Z': return 'sticky'
  }
  const PropertyBool = info.classReverse[CLASS.BLOCK_PROPERTY_BOOL]
  if (!PropertyBool) clsInfo.done = false
  if (PropertyBool && sig === 'L' + PropertyBool + ';') return 'EXTENDED'
}

export function method (methodInfo: MethodInfo) {
  const { code, info, clsInfo } = methodInfo
  if (s`(${CLASS.WORLD}${CLASS.BLOCK_POS}${CLASS.FACING}Z)Z`.matches(methodInfo)) {
    const newHelper = code.lines[0].nextOp('new', true)
    console.log(getMethodInheritance(methodInfo))
    if (newHelper) info.class[newHelper.className].name = CLASS.PISTON_MOVE_HELPER
    return 'doMove'
  }
  for (const line of code.lines) {
    if (line.const === 'extended') {
      const field = (line.nextOp('putfield') || {}).field
      if (field) {
        clsInfo.fields[field.fieldName].name = 'EXTENDED'
        info.class[field.type.slice(1, -1)].name = CLASS.BLOCK_PROPERTY_BOOL
      }
    }
  }
}
