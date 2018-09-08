// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '()Ljava/util/Iterator;': return 'chunkIterator'
    case '(II)Z': return 'contains'
    case '(I)I': return 'getFarthestBlock'
    case '(IIIII)Z': return 'overlaps'
    case '(I)V': return 'setViewDistance'
  }
  if (s`(${CLASS.SERVER_PLAYER}II)Z`.matches(methodInfo)) return 'isPlayerWatchingChunk'
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'I': return 'viewDistance'
    case 'J': return 'previousTotalWorldTime'
    case 'Lit/unimi/dsi/fastutil/longs/Long2ObjectMap;': return 'entries'
    case 'Ljava/util/Set;': return 'dirtyEntries'
  }
  if (s`${CLASS.SERVER_WORLD}`.matches(fieldInfo)) return 'world'
}
