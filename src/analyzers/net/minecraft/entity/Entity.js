// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'
import { nbtFieldNamer } from '../../../sharedLogic'

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
  const { info, clsInfo, code } = methodInfo
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
        nbtFieldNamer(methodInfo, {
          Pos: ['x', 'y', 'z'],
          Motion: ['vx', 'vy', 'vz'],
          Rotation: ['yaw', 'pitch']
        })
        for (const c of code.calls) {
          if (c.signature === `(${methodInfo.argSigs[0]})V`) {
            const key = `${c.methodName}:${c.signature}`
            clsInfo.method[key].name = 'addAdditionalSaveData'
            for (const scName of clsInfo.allSubClasses) {
              if (!info.classNames.includes(scName)) continue
              const sc = info.class[scName]
              try {
                nbtFieldNamer(sc.method[key])
              } catch (e) {
                console.error(e)
              }
            }
            break
          }
        }
        return 'save'
      }
      case 'Loading entity NBT': {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.NBT_COMPOUND
        for (const c of code.calls) {
          if (c.signature === `(${methodInfo.argSigs[0]})V`) {
            clsInfo.method[`${c.methodName}:${c.signature}`].name = 'readAdditionalSaveData'
            break
          }
        }
        return 'load'
      }
      case 'Checking entity block collision': return 'move'
      case 'Colliding entity with block': return 'checkBlockCollisions'
      case 'entityBaseTick': return 'entityBaseTick'
    }
  }
}
