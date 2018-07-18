import * as CLASS from '../../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const ChunkPos = info.classReverse[CLASS.CHUNK_POS]
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  if (!ChunkPos || !NBTCompound) clsInfo.done = false
  if (ChunkPos && NBTCompound && sig === `(L${ChunkPos};L${NBTCompound};)V`) return method.isPrivate() ? 'save' : 'queueSave'
  if (code.consts.includes('Failed to save chunk')) return 'writeNextIO'
  if (NBTCompound && sig.startsWith('(L' + NBTCompound + ';)L')) return 'getChunkType'
  switch (sig) {
    case '()V': {
      if ((code.lines[2] || {}).op === 'putfield') return 'saveAll'
      break
    }
  }
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/io/File;': return 'dimensionDirectory'
    case 'Lit/unimi/dsi/fastutil/objects/Object2ObjectMap;': return 'saveQueue'
    case 'Lnet/minecraft/util/datafix/DataFixer;': return 'dataFixer'
    case 'Z': return 'savingAll'
  }
}
