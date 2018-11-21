// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.ENCHANTMENT_PROTECTION$TYPE}`.matches(fieldInfo)) return 'type'
}
