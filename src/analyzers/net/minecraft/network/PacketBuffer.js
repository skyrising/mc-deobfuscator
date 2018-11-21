// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo } = methodInfo
  const PacketBuffer = clsInfo.obfName
  if (sig.endsWith('[B') && methodInfo.obfName !== 'array') return 'readByteArray'
  else if (sig.endsWith('[I')) return 'readVarIntArray'
  else if (sig.endsWith('[J')) return 'readLongArray'
  if (s`([B)${CLASS.PACKET_BUFFER}`.matches(methodInfo)) return 'writeByteArray'
  if (s`([I)${CLASS.PACKET_BUFFER}`.matches(methodInfo)) return 'writeVarIntArray'
  if (s`([J)${CLASS.PACKET_BUFFER}`.matches(methodInfo)) return 'writeLongArray'
  if (s`()${CLASS.BLOCK_POS}`.matches(methodInfo)) return 'readBlockPos'
  if (s`(${CLASS.BLOCK_POS})${CLASS.PACKET_BUFFER}`.matches(methodInfo)) return 'writeBlockPos'
  if (s`()${CLASS.TEXT_COMPONENT}`.matches(methodInfo)) return 'readTextComponent'
  if (s`(${CLASS.TEXT_COMPONENT})${CLASS.PACKET_BUFFER}`.matches(methodInfo)) return 'writeTextComponent'
  if (s`()${CLASS.RESOURCE_LOCATION}`.matches(methodInfo)) return 'readIdentifier'
  if (s`(${CLASS.RESOURCE_LOCATION})${CLASS.PACKET_BUFFER}`.matches(methodInfo)) return 'writeIdentifier'
  switch (sig) {
    case '(Ljava/lang/Class;)Ljava/lang/Enum;': return 'readEnum'
    case '(Ljava/lang/Enum;)L' + PacketBuffer + ';': return 'writeEnum'
    case '()Ljava/util/Date;': return 'readDate'
    case '(Ljava/util/Date;)L' + PacketBuffer + ';': return 'writeDate'
    case '()Ljava/util/UUID;': return 'readUUID'
    case '(Ljava/util/UUID;)L' + PacketBuffer + ';': return 'writeUUID'
  }
  for (const c of code.consts) {
    if (c === 'VarInt too big') return 'readVarInt'
    if (c === 'VarLong too big') return 'readVarLong'
    if (c === 'The received encoded string buffer length is less than zero! Weird string!') return 'readString'
    if (c === 'String too big (was ') return 'writeString'
  }
}
