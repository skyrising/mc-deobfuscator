// @flow
import * as CLASS from '../../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const {sig, clsInfo, info} = fieldInfo
  const World = info.classReverse[CLASS.WORLD]
  if (!World) clsInfo.done = false
  if (World && sig === 'L' + World + ';') return 'world'
  switch (sig) {
    case 'Ljava/util/Map;': return 'playerReputation'
  }
}

export function method (methodInfo: MethodInfo) {
  const {sig, clsInfo, info} = methodInfo
  const BlockPos = info.classReverse[CLASS.BLOCK_POS]
  if (!BlockPos) clsInfo.done = false
  else if (sig.startsWith('(L' + BlockPos + ';III)')) {
    info.class[method.getReturnType().getClassName()].name = CLASS.VEC_3D
    return 'findRandomSpawnPos'
  }
  switch (sig) {
    case '(Ljava/lang/String;)I': return 'getPlayerReputation'
    case '(Ljava/lang/String;I)I': return 'modifyPlayerReputation'
    case '(Ljava/lang/String;)Z': return 'isPlayerReputationLow'
  }
}
