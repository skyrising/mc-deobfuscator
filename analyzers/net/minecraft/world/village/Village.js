import * as CLASS from '../../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  const World = info.classReverse[CLASS.WORLD]
  if (!World) clsInfo.done = false
  if (World && sig === 'L' + World + ';') return 'world'
  switch (sig) {
    case 'Ljava/util/Map;': return 'playerReputation'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const BlockPos = info.classReverse[CLASS.BLOCK_POS]
  if (!BlockPos) clsInfo.done = false
  if (sig.startsWith('(L' + BlockPos + ';III)')) {
    info.class[method.getReturnType().getClassName()].name = CLASS.VEC_3D
    return 'findRandomSpawnPos'
  }
  switch (sig) {
    case '(Ljava/lang/String;)I': return 'getPlayerReputation'
    case '(Ljava/lang/String;I)I': return 'modifyPlayerReputation'
    case '(Ljava/lang/String;)Z': return 'isPlayerReputationLow'
  }
}
