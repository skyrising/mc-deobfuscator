// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  if (s`(${CLASS.WORLD}${CLASS.CHUNK})${CLASS.BLOCK_POS}`.matches(methodInfo)) return 'getStartPosition'
}
