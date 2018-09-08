// @flow
import { signatureTag as s } from '../../../../../util/code'
import * as CLASS from '../../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo } = fieldInfo
  const BlockPos = clsInfo.obfName
  switch (sig) {
    case 'L' + BlockPos + ';': return 'ORIGIN'
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
