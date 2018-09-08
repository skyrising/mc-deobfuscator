// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo, info } = fieldInfo
  const World = info.classReverse[CLASS.WORLD]
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  const AxisAlignedBB = info.classReverse[CLASS.AABB]
  if (!World || !NBTCompound || !AxisAlignedBB) clsInfo.done = false
  if (World && sig === 'L' + World + ';') return 'world'
  if (AxisAlignedBB && sig === 'L' + AxisAlignedBB + ';' && fieldInfo.static) return 'EMPTY_AABB'
  if (sig === 'I' && fieldInfo.static) return 'nextEntityId'
  switch (sig) {
    case 'L' + clsInfo.obfName + ';': return 'riding'
    case 'Ljava/util/List;': return fieldInfo.static ? 'EMPTY_ITEM_LIST' : 'riders'
    case 'Ljava/util/Random;': return 'random'
    case 'Ljava/util/UUID;': return 'uuid'
    case 'Ljava/lang/String;': return 'uuidString'
    case 'Ljava/util/Set;': return 'tags'
  }
}
