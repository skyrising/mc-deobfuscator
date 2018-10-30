// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.WORLD_TYPE}`.matches(fieldInfo)) return 'worldType'
  if (s`${CLASS.GAME_RULES}`.matches(fieldInfo)) return 'gameRules'
  if (s`${CLASS.DIFFICULTY}`.matches(fieldInfo)) return fieldInfo.flags.static && fieldInfo.flags.final ? 'DEFAULT_DIFFICULTY' : 'difficulty'
}
