// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'
import { nbtFieldNamer } from '../../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  const { code } = methodInfo
  if (s`(${CLASS.NBT_COMPOUND})V`.matches(methodInfo)) {
    if (!code.consts.includes(10)) {
      nbtFieldNamer(methodInfo)
      return 'serialize'
    } else {
      return 'deserialize'
    }
  }
}
