// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.origName === '<init>' && methodInfo.args.length === 3) {
    methodInfo.clsInfo.info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.PLAYER_CHUNK_MAP
  }
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case '[S': return 'changedBlocks'
    case 'J': return 'lastUpdateInhabitedTime'
    case 'Z': return 'sentToPlayers'
    case 'Ljava/util/List;': return 'players'
  }
  if (s`${CLASS.CHUNK}`.matches(fieldInfo)) return 'chunk'
  if (s`${CLASS.CHUNK_POS}`.matches(fieldInfo)) return 'pos'
  if (s`${CLASS.PLAYER_CHUNK_MAP}`.matches(fieldInfo)) return 'map'
}
