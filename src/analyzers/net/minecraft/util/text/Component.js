// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function method (methodInfo: MethodInfo) {
  if (s`()${CLASS.TEXT_STYLE}`.matches(methodInfo)) return 'getComputedStyle'
  if (s`(${CLASS.TEXT_STYLE})${CLASS.TEXT_COMPONENT}`.matches(methodInfo)) return 'withStyle'
}
