// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  if (fieldInfo.sig === 'I' && fieldInfo.flags.static) return 'nextEntityId'
  switch (fieldInfo.sig) {
    case 'L' + clsInfo.obfName + ';': return 'riding'
    case 'Ljava/util/List;': return fieldInfo.flags.static ? 'EMPTY_ITEM_LIST' : 'riders'
    case 'Ljava/util/Random;': return 'random'
    case 'Ljava/util/UUID;': return 'uuid'
    case 'Ljava/lang/String;': return 'uuidString'
    case 'Ljava/util/Set;': return 'tags'
  }
  if (s`${CLASS.WORLD}`.matches(fieldInfo)) return 'world'
  if (s`${CLASS.AABB}`.matches(fieldInfo) && fieldInfo.flags.static) return 'EMPTY_AABB'
}

export function method (methodInfo: MethodInfo) {
  const { info, code } = methodInfo
  for (const c of code.constants) {
    switch (c.value) {
      case 'changeDimension': return 'changeDimension'
      case 'Entity\'s Exact location': {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.CRASH_REPORT_CATEGORY
        return 'addCrashInfo'
      }
      case 'sendCommandFeedback': return 'shouldSendCommandFeedback'
      case 'Use x.startRiding(y), not y.addPassenger(x)': return 'addPassenger'
      case 'Use x.stopRiding(y), not y.removePassenger(x)': return 'removePassenger'
      case 'Saving entity NBT': {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.NBT_COMPOUND
        return 'saveToNBT'
      }
      case 'Loading entity NBT': {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.NBT_COMPOUND
        return 'readFromNBT'
      }
      case 'Checking entity block collision': return 'move'
      case 'Colliding entity with block': return 'checkBlockCollisions'
      case 'entityBaseTick': return 'entityBaseTick'
    }
  }
}
