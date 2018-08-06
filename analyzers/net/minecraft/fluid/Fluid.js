import {signatureTag as s} from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (s`()${CLASS.ITEM}`.matches(methodInfo)) return 'getBucket'
}
