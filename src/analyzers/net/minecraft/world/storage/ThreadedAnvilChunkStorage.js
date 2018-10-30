// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo, info } = methodInfo
  const ChunkPos = info.classReverse[CLASS.CHUNK_POS]
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  if (!ChunkPos || !NBTCompound) clsInfo.done = false
  if (ChunkPos && NBTCompound && sig === `(L${ChunkPos};L${NBTCompound};)V`) return methodInfo.flags.private ? 'save' : 'queueSave'
  if (NBTCompound && sig.startsWith('(L' + NBTCompound + ';)L')) return 'getChunkType'
  switch (sig) {
    case '()V': {
      if ((code.lines[2] || {}).op === 'putfield') return 'saveAll'
      break
    }
  }
  if (code.consts.includes('DataVersion')) {
    for (const line of code.lines) {
      if (line.op === 'if_icmpge') {
        if (typeof line.previous.const === 'number' && line.next.next.const === 'DataVersion') {
          info.data.general = info.data.general || {}
          info.data.general.dataVersion = line.previous.const
          break
        }
      }
    }
  }
  if (code.consts.includes('Failed to save chunk')) return 'writeNextIO'
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/io/File;': return 'dimensionDirectory'
    case 'Lit/unimi/dsi/fastutil/objects/Object2ObjectMap;': return 'saveQueue'
    case 'Lnet/minecraft/util/datafix/DataFixer;': return 'dataFixer'
    case 'Z': return 'savingAll'
  }
}
