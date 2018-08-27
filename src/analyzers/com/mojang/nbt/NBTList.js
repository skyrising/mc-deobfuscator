
export function method (cls, method, code, methodInfo, clsInfo, info) {
  const NBTBase = cls.getSuperclassName()
  switch (methodInfo.sig) {
    case '()I': return 'size'
    case '(L' + NBTBase + ';)V': return 'add'
    case '(I)L' + NBTBase + ';': return 'get'
  }
}

export function field (fieldInfo) {
  const {sig} = fieldInfo
  switch (sig) {
    case 'Ljava/util/List;': return 'list'
    case 'B': return 'tagType'
  }
}
