import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  const ifs = cls.getInterfaces()
  if (ifs.length === 1) {
    info.class[ifs[0].getClassName()].name = CLASS.BLOCK_ENTITY_PROVIDER
  }
}
