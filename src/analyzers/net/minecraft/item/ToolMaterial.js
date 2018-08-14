import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  if (sig.startsWith('L')) {
    info.class[field.getType().getClassName()].name = CLASS.CACHING_SUPPLIER
    return 'ingredient'
  }
}
