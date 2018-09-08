// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Map;': return 'playerReputation'
  }
  if (s`${CLASS.WORLD}`.matches(fieldInfo)) return 'world'
}

export function method (methodInfo: MethodInfo) {
  const { sig, clsInfo, info } = methodInfo
  const BlockPos = info.classReverse[CLASS.BLOCK_POS]
  if (!BlockPos) clsInfo.done = false
  else if (sig.startsWith('(L' + BlockPos + ';III)')) { // TODO: wildcards
    info.class[method.getReturnType().getClassName()].name = CLASS.VEC_3D
    return 'findRandomSpawnPos'
  }
  switch (sig) {
    case '(Ljava/lang/String;)I': return 'getPlayerReputation'
    case '(Ljava/lang/String;I)I': return 'modifyPlayerReputation'
    case '(Ljava/lang/String;)Z': return 'isPlayerReputationLow'
  }
}
