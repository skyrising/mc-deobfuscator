export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const PacketBuffer = cls.getClassName()
  if (sig.endsWith('[B')) return 'readByteArray'
  else if (sig.endsWith('[I')) return 'readVarIntArray'
  switch (sig) {
    case '(Ljava/lang/Class;)Ljava/lang/Enum;': return 'readEnum'
    case '(Ljava/lang/Enum;)L' + PacketBuffer + ';': return 'writeEnum'
    case '()Ljava/util/Date;': return 'readDate'
    case '(Ljava/util/Date;)L' + PacketBuffer + ';': return 'writeDate'
    case '()Ljava/util/UUID;': return 'readUUID'
    case '(Ljava/util/UUID;)L' + PacketBuffer + ';': return 'writeUUID'
  }
}
