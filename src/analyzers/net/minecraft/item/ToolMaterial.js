// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const {sig, info} = fieldInfo
  if (sig.startsWith('L')) {
    info.class[sig.slice(1, -1)].name = CLASS.CACHING_SUPPLIER
    return 'ingredient'
  }
}
