// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const {clsInfo, info} = methodInfo
  const BlockEntity = info.classReverse[CLASS.BLOCK_ENTITY]
  if (!BlockEntity) clsInfo.done = false
  if (BlockEntity && methodInfo.sig.endsWith(')L' + BlockEntity + ';')) return 'createBlockEntity'
}
