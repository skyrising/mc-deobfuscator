import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  info.class[cls.getSuperclassName()].name = CLASS.CONTAINER_BLOCK
}
