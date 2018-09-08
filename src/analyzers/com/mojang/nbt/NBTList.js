// @flow

export function method (methodInfo: MethodInfo) {
  const NBTBase = methodInfo.clsInfo.obfName
  switch (methodInfo.sig) {
    case '()I': return 'size'
    case '(L' + NBTBase + ';)V': return 'add'
    case '(I)L' + NBTBase + ';': return 'get'
  }
}

export function field (fieldInfo: FieldInfo) {
  const { sig } = fieldInfo
  switch (sig) {
    case 'Ljava/util/List;': return 'list'
    case 'B': return 'tagType'
  }
}
