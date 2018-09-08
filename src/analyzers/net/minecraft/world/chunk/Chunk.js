// @flow
import * as CLASS from '../../../../../ClassNames'
import {signatureTag as s} from '../../../../../util/code'

export function method (methodInfo: MethodInfo) {
  if (s`(${CLASS.HEIGHTMAP$TYPE}II)I`.matches(methodInfo)) return 'getHeightAt'
}
