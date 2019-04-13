// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'
import { constructorFieldNamer } from '../../../sharedLogic'

export function field (fieldInfo: FieldInfo) {
  const { flags } = fieldInfo
  switch (fieldInfo.sig) {
    case 'I': {
      if (flags.public && flags.final) return 'syncId'
      break
    }
  }
  if (s`${CLASS.CONTAINER_TYPE}`.matches(fieldInfo)) return 'type'
}

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.obfName === '<init>') return constructorFieldNamer(methodInfo, ['type', 'syncId'])
  switch (methodInfo.sig) {
    case '(II)V': return 'setProperty(pos,propertyId)'
  }
  if (s`()${CLASS.CONTAINER_TYPE}`.matches(methodInfo)) return 'getType'
  if (s`(${CLASS.BLOCK_ENTITY})I`.matches(methodInfo)) return 'calculateComparatorOutput(entity)'
  if (s`(${CLASS.CONTAINER_PROPERTY_DELEGATE})V`.matches(methodInfo)) return 'readData(data)'
  if (code.consts.includes('Container data count ')) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.CONTAINER_PROPERTY_DELEGATE
    return 'checkContainerDataCount(data,expectedCount)'
  }
  if (code.consts.includes('Container size ')) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.INVENTORY
    return 'checkContainerSize(inventory,expectedSize)'
  }
}
