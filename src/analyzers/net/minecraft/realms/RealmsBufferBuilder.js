// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { info } = fieldInfo
  switch (fieldInfo.obfName) {
    case 'b': {
      info.class[fieldInfo.sig.slice(1, -1)].name = CLASS.BUFFER_BUILDER
    }
  }
}
