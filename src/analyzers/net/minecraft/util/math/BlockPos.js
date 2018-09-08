// @flow
import { signatureTag as s } from '../../../../../util/code'
import * as CLASS from '../../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  switch (fieldInfo.sig) {
    case 'L' + clsInfo.obfName + ';': return 'ORIGIN'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, clsInfo } = methodInfo
  const BlockPos = clsInfo.obfName
  if (s`(${CLASS.FACING})${CLASS.BLOCK_POS}`.matches(methodInfo)) return 'offset'
  switch (sig) {
    case '()J': return 'toLong'
    case '(J)L' + BlockPos + ';': return 'fromLong'
  }
}
