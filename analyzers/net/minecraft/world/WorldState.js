import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  if (sig.endsWith('I)I')) return 'getCombinedLight'
  if (sig.endsWith(')I')) return 'getStrongPower'
  if (sig.endsWith(')Z')) return 'isAirBlock'
  const WorldType = info.classReverse[CLASS.WORLD_TYPE]
  const Biome = info.classReverse[CLASS.BIOME]
  const BlockState = info.classReverse[CLASS.BLOCK_STATE]
  const BlockEntity = info.classReverse[CLASS.BLOCK_ENTITY]
  if (!WorldType || !Biome || !BlockState || !BlockEntity) clsInfo.done = false
  if (WorldType && sig === '()L' + WorldType + ';') return 'getWorldType'
  if (Biome && sig.endsWith('L' + Biome + ';')) return 'getBiome'
  if (BlockState && sig.endsWith('L' + BlockState + ';')) return 'getBlockState'
  if (BlockEntity && sig.endsWith('L' + BlockEntity + ';')) return 'getBlockEntity'
}
