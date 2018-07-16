import * as CLASS from '../../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  const ifs = cls.getInterfaceNames()
  if (ifs.length === 1) info.class[ifs[0]].name = CLASS.CHUNK_LOADER
}
