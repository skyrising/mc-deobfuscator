import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  const World = info.classReverse[CLASS.WORLD]
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  const AxisAlignedBB = info.classReverse[CLASS.AABB]
  if (!World || !NBTCompound || !AxisAlignedBB) clsInfo.done = false
  if (World && sig === 'L' + World + ';') return 'world'
  if (AxisAlignedBB && sig === 'L' + AxisAlignedBB + ';' && field.isStatic()) return 'EMPTY_AABB'
  if (sig === 'I' && field.isStatic()) return 'nextEntityId'
  switch (sig) {
    case 'L' + cls.getClassName() + ';': return 'riding'
    case 'Ljava/util/List;': return field.isStatic() ? 'EMPTY_ITEM_LIST' : 'riders'
    case 'Ljava/util/Random;': return 'random'
    case 'Ljava/util/UUID;': return 'uuid'
    case 'Ljava/lang/String;': return 'uuidString'
    case 'Ljava/util/Set;': return 'tags'
  }
}
