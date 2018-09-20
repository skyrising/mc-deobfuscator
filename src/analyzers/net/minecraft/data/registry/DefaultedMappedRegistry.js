// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  if (fieldInfo.sig === 'Ljava/lang/Object;') return 'defaultValue'
  if (s`${CLASS.RESOURCE_LOCATION}`.matches(fieldInfo)) return 'defaultKey'
}
