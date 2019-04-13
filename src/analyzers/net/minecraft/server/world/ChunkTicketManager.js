// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Lit/unimi/dsi/fastutil/longs/Long2ObjectOpenHashMap;': return 'positionToTicketSet'
    case 'Ljava/util/Set;': return 'chunkHolders'
    case 'Lit/unimi/dsi/fastutil/longs/LongSet;': return 'chunkPositions'
  }
}

export function method (methodInfo: MethodInfo) {
  if (s`(J${CLASS.CHUNK_TICKET})V`.matches(methodInfo)) return 'addTicket(position,ticket)'
}
