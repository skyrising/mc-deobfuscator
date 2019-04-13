// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'group'
    case 'I': return 'cookingTime'
    case 'F': return 'experience'
  }
  if (s`${CLASS.RESOURCE_LOCATION}`.matches(fieldInfo)) return 'id'
  if (s`${CLASS.ITEM_STACK}`.matches(fieldInfo)) return 'result'
  if (s`${CLASS.RECIPE_TYPE}`.matches(fieldInfo)) return 'type'
  if (s`${CLASS.RECIPE_SERIALIZER}`.matches(fieldInfo)) return 'serializer'
}
