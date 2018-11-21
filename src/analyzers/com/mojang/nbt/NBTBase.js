// @flow
import * as CLASS from '../../../../ClassNames'

const ID_TO_CLASS = [
  CLASS.NBT_END,
  CLASS.NBT_BYTE,
  CLASS.NBT_SHORT,
  CLASS.NBT_INT,
  CLASS.NBT_LONG,
  CLASS.NBT_FLOAT,
  CLASS.NBT_DOUBLE,
  CLASS.NBT_BYTE_ARRAY,
  CLASS.NBT_STRING,
  CLASS.NBT_LIST,
  CLASS.NBT_COMPOUND,
  CLASS.NBT_INT_ARRAY,
  CLASS.NBT_LONG_ARRAY
]

export function method (methodInfo: MethodInfo) {
  const NBTBase = methodInfo.clsInfo.obfName
  const { info, code } = methodInfo
  if (methodInfo.obfName === 'toString') return
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
    case '(B)L' + NBTBase + ';': {
      for (const line of code.lines) {
        if (line.op !== 'tableswitch') continue
        for (const c of line.tableswitch.cases) {
          if (c.value === 'default' || c.target.op !== 'new') continue
          const className = c.target.className
          const name = ID_TO_CLASS[c.value]
          if (!name) continue
          info.class[className].name = name
        }
        break
      }
      return 'createTag'
    }
    case '(B)Ljava/lang/String;': return 'getType'
  }
}

export function field (fieldInfo: FieldInfo) {
  const { sig } = fieldInfo
  switch (sig) {
    case 'Ljava/lang/String;': return 'key'
  }
}
