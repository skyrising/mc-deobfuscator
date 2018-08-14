import * as CLASS from '../../../../../ClassNames'
import {signatureTag as s} from '../../../../../util/code'

export function method (methodInfo) {
  const {code, info} = methodInfo
  if (methodInfo.origName === '<init>' && s`(${CLASS.ENTITY})V`) {
    const newCls = code.lines[0].nextOp('new', true)
    if (newCls) info.class[newCls.className].name = CLASS.VEC_3D
  }
}

const FIELD_TYPE_NAME_MAP = {
  [CLASS.BLOCK_POS]: 'blockPos',
  [CLASS.HIT_RESULT$TYPE]: 'type',
  [CLASS.FACING]: 'facing',
  [CLASS.VEC_3D]: 'pos',
  [CLASS.ENTITY]: 'entity'
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  for (const deobfType in FIELD_TYPE_NAME_MAP) {
    const obfType = info.classReverse[deobfType]
    if (!obfType) {
      clsInfo.done = false
      continue
    }
    if (sig === 'L' + obfType + ';') return FIELD_TYPE_NAME_MAP[deobfType]
  }
}
