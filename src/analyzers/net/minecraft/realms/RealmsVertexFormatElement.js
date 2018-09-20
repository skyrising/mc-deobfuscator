// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { info } = fieldInfo
  switch (fieldInfo.obfName) {
    case 'v': {
      info.class[fieldInfo.sig.slice(1, -1)].name = CLASS.VERTEX_FORMAT
    }
  }
}
