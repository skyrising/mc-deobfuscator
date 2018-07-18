import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  info.class[cls.getSuperclassName()].name = CLASS.GRAVITY_BLOCK
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'I': return 'color'
  }
}
