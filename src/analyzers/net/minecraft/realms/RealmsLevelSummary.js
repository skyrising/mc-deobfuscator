// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { info } = fieldInfo
  switch (fieldInfo.obfName) {
    case 'levelSummary': {
      info.class[fieldInfo.sig.slice(1, -1)].name = CLASS.WORLD_SUMMARY
    }
  }
}
