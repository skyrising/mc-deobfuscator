import {signatureTag as s} from '../../../../util/code'
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
  const ChunkProvider = info.classReverse[CLASS.CHUNK_PROVIDER]
  if (!WorldInfo || !Profiler || !VillageCollection || !ChunkProvider) clsInfo.done = false
  if (WorldInfo && sig === 'L' + WorldInfo + ';') return 'worldInfo'
  if (Profiler && sig === 'L' + Profiler + ';') return 'profiler'
  if (VillageCollection && sig === 'L' + VillageCollection + ';') return 'villages'
  if (ChunkProvider && sig === 'L' + ChunkProvider + ';') return 'chunkProvider'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (s`(${CLASS.BLOCK_POS})${CLASS.BLOCK_STATE}`.matches(methodInfo)) return 'getBlockState'
  if (s`(${CLASS.BLOCK_POS}${CLASS.BLOCK_STATE}I)Z`.matches(methodInfo)) return 'setBlockState'
  if (sig.startsWith('(L') && sig.endsWith(')Z') && code.consts.includes(0.014)) {
    return 'handleMaterialMovement'
  }
  switch (sig) {
    case '(IIIIIIZ)Z': return 'isAreaLoaded'
  }
}
