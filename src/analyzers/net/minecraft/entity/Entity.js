// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  if (fieldInfo.sig === 'I' && fieldInfo.flags.static) return 'nextEntityId'
  switch (fieldInfo.sig) {
    case 'L' + clsInfo.obfName + ';': return 'riding'
    case 'Ljava/util/List;': return fieldInfo.flags.static ? 'EMPTY_ITEM_LIST' : 'riders'
    case 'Ljava/util/Random;': return 'random'
    case 'Ljava/util/UUID;': return 'uuid'
    case 'Ljava/lang/String;': return 'uuidString'
    case 'Ljava/util/Set;': return 'tags'
  }
  if (s`${CLASS.WORLD}`.matches(fieldInfo)) return 'world'
  if (s`${CLASS.AABB}`.matches(fieldInfo) && fieldInfo.flags.static) return 'EMPTY_AABB'
}
