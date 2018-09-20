// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { info } = fieldInfo
  switch (fieldInfo.obfName) {
    case 'editBox': {
      info.class[fieldInfo.sig.slice(1, -1)].name = CLASS.GUI_EDIT_BOX
    }
  }
}
