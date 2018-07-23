import {signatureTag as s} from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  info.class[cls.getSuperclassName()].name = CLASS.DIRECTIONAL_BLOCK
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Z': return 'sticky'
  }
  const PropertyBool = info.classReverse[CLASS.BLOCK_PROPERTY_BOOL]
  if (!PropertyBool) clsInfo.done = false
  if (PropertyBool && sig === 'L' + PropertyBool + ';') return 'EXTENDED'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (s`(${CLASS.WORLD}${CLASS.BLOCK_POS}${CLASS.FACING}Z)Z`.matches(methodInfo)) {
    const newHelper = code.lines[0].nextOp('new', true)
    console.log('PistonMoveHelper: ' + newHelper)
    if (newHelper) info.class[newHelper.className].name = CLASS.PISTON_MOVE_HELPER
    return 'doMove'
  }
  for (const line of code.lines) {
    if (line.const === 'extended') {
      const field = (line.nextOp('putfield') || {}).field
      if (field) {
        clsInfo.field[field.fieldName] = 'EXTENDED'
        info.class[field.type.slice(1, -1)].name = CLASS.BLOCK_PROPERTY_BOOL
      }
    }
  }
}
