import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  const ifs = cls.getInterfaces()
  if (ifs.length === 1) info.class[ifs[0].getClassName()].name = CLASS.WORLD_STATE
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Random;': return 'rand'
    case '[I': return 'lightUpdateBlockList'
  }
  const WorldInfo = info.classReverse[CLASS.WORLD_INFO]
  const Profiler = info.classReverse[CLASS.PROFILER]
  const VillageCollection = info.classReverse[CLASS.VILLAGE_COLLECTION]
  if (!WorldInfo || !Profiler || !VillageCollection) clsInfo.done = false
  if (WorldInfo && sig === 'L' + WorldInfo + ';') return 'worldInfo'
  if (Profiler && sig === 'L' + Profiler + ';') return 'profiler'
  if (VillageCollection && sig === 'L' + VillageCollection + ';') return 'villages'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const BlockPos = info.classReverse[CLASS.BLOCK_POS]
  const BlockState = info.classReverse[CLASS.BLOCK_STATE]
  if (!BlockPos || !BlockState) clsInfo.done = false
  if (BlockPos && BlockState && sig === `(L${BlockPos};)L${BlockState};`) return 'getBlockState'
  if (sig.startsWith('(L') && sig.endsWith(')Z') && code.consts.includes(0.014)) {
    return 'handleMaterialMovement'
  }
  switch (sig) {
    case '(IIIIIIZ)Z': return 'isAreaLoaded'
  }
}
