// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '()Z': return 'isIgnoredInRecipeBook'
    case '(II)Z': return 'fits(width,height)'
  }
  if (s`()${CLASS.NON_NULL_LIST}`.matches(methodInfo)) return 'getPreviewInputs'
  if (s`(${CLASS.INVENTORY})${CLASS.NON_NULL_LIST}`.matches(methodInfo)) return 'getRemainingStacks'
  if (s`()${CLASS.ITEM_STACK}`.matches(methodInfo) && !methodInfo.flags.abstract) return 'getRecipeKindIcon'
  if (s`(${CLASS.INVENTORY})${CLASS.ITEM_STACK}`.matches(methodInfo)) return 'craft'
  if (s`(${CLASS.INVENTORY}${CLASS.WORLD})Z`.matches(methodInfo)) return 'matches'
}
