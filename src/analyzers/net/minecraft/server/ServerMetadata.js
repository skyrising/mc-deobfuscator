// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'favicon'
  }
  if (s`${CLASS.TEXT_COMPONENT}`.matches(fieldInfo)) return 'description'
}
