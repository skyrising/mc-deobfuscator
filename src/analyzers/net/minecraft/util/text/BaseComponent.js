// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/List;': return 'siblings'
  }
  if (s`${CLASS.TEXT_STYLE}`.matches(fieldInfo)) return 'style'
}
