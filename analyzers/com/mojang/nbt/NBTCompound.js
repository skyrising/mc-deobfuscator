import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  const scl = cls.getSuperclassName()
  if (scl === 'java.lang.Object') {
    info.class[cls.getInterfaces()[0].getClassName()].name = CLASS.NBT_BASE
  } else {
    info.class[scl].name = CLASS.NBT_BASE
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const NBTCompound = cls.obfName
  const NBTBase = cls.getSuperclassName()
  switch (methodInfo.sig) {
    case '(Ljava/lang/String;B)V': return 'setByte'
    case '(Ljava/lang/String;S)V': return 'setShort'
    case '(Ljava/lang/String;I)V': return 'setInt'
    case '(Ljava/lang/String;J)V': return 'setLong'
    case '(Ljava/lang/String;F)V': return 'setFloat'
    case '(Ljava/lang/String;D)V': return 'setDouble'
    case '(Ljava/lang/String;Z)V': return 'setBoolean'
    case '(Ljava/lang/String;[B)V': return 'setByteArray'
    case '(Ljava/lang/String;[I)V': return 'setIntArray'
    case '(Ljava/lang/String;[J)V': return 'setLongArray'
    case '(Ljava/lang/String;Ljava/lang/String;)V': return 'setString'
    case '(Ljava/lang/String;L' + NBTCompound + ';)V': return 'setTagCompound'
    case '(Ljava/lang/String;L' + NBTBase + ';)V': return 'setTag'
    case '(Ljava/lang/String;Ljava/util/UUID;)V': return 'setUUID'
    case '(Ljava/lang/String;)B': return code.consts.includes(99) ? 'getByte' : 'getTypeOf'
    case '(Ljava/lang/String;)S': return 'getShort'
    case '(Ljava/lang/String;)I': return 'getInt'
    case '(Ljava/lang/String;)J': return 'getLong'
    case '(Ljava/lang/String;)F': return 'getFloat'
    case '(Ljava/lang/String;)D': return 'getDouble'
    case '(Ljava/lang/String;)Z': {
      if (code.consts.includes('Most')) return 'containsUUID'
      return code.lines[0].nextOp('invokeinterface') ? 'containsKey' : 'getBoolean'
    }
    case '(Ljava/lang/String;I)Z': return 'containsKey'
    case '(Ljava/lang/String;)[B': return 'getByteArray'
    case '(Ljava/lang/String;)[I': return 'getIntArray'
    case '(Ljava/lang/String;)[J': return 'getLongArray'
    case '(Ljava/lang/String;)Ljava/lang/String;': return 'getString'
    case '(Ljava/lang/String;)L' + NBTCompound + ';': return 'getTagCompound'
    case '(Ljava/lang/String;)L' + NBTBase + ';': return 'getTag'
    case '(Ljava/lang/String;)Ljava/util/UUID;': return 'getUUID'
    case '()Ljava/util/Set;': return 'keySet'
    case '()I': return 'size'
  }
  const NBTList = info.classReverse[CLASS.NBT_LIST]
  if (!NBTList) clsInfo.done = methodInfo.done = false
  else {
    if (sig === '(Ljava/lang/String;L' + NBTList + ';)V') return 'setList'
    if (sig === '(Ljava/lang/String;)L' + NBTList + ';') return 'getList'
  }
}

export function field (field) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Map;': return 'map'
  }
}
