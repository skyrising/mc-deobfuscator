// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.obfName === '<init>' && s`(${CLASS.ENTITY})V`) {
    const newCls = code.lines[0].nextOp('new', true)
    if (newCls) info.class[newCls.className].name = CLASS.VEC_3D
  }
}

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.BLOCK_POS}`.matches(fieldInfo)) return 'blockPos'
  if (s`${CLASS.HIT_RESULT$TYPE}`.matches(fieldInfo)) return 'type'
  if (s`${CLASS.FACING}`.matches(fieldInfo)) return 'facing'
  if (s`${CLASS.VEC_3D}`.matches(fieldInfo)) return 'pos'
  if (s`${CLASS.ENTITY}`.matches(fieldInfo)) return 'entity'
}
