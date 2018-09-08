// @flow

export function method (methodInfo: MethodInfo) {
  const NBTBase = methodInfo.clsInfo.obfName
  if (methodInfo.origName === 'toString') return
  switch (methodInfo.sig) {
    case '()Ljava/lang/String;': return 'getKey'
    case '(Ljava/lang/String;)V':
    case '(Ljava/lang/String;)L' + NBTBase + ';':
      return 'setKey'
    case '()B': return 'getId'
    case '(Ljava/io/DataInput;)L' + NBTBase + ';':
    case '(Ljava/io/DataInput;)V': return 'read'
    case '(L' + NBTBase + ';Ljava/io/DataOutput;)V':
    case '(Ljava/io/DataOutput;)V': return 'write'
    case '(B)L' + NBTBase + ';': return 'createTag'
    case '(B)Ljava/lang/String;': return 'getType'
  }
}

export function field (fieldInfo: FieldInfo) {
  const {sig} = fieldInfo
  switch (sig) {
    case 'Ljava/lang/String;': return 'key'
  }
}
