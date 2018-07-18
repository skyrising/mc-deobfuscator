import * as CLASS from '../../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const BlockEntity = info.classReverse[CLASS.BLOCK_ENTITY]
  if (!BlockEntity) clsInfo.done = false
  if (BlockEntity && sig.endsWith(')L' + BlockEntity + ';')) return 'createBlockEntity'
}
