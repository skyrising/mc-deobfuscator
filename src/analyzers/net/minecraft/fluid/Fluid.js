// @flow
import { signatureTag as s } from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  if (s`()${CLASS.ITEM}`.matches(methodInfo)) return 'getBucket'
}
