// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'I': return 'priority'
    case 'Z': return 'used'
  }
  if (s`${CLASS.AI_GOAL}`.matches(fieldInfo)) return 'goal'
}
