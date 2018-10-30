// @flow
import { registryMethod } from '../../../sharedLogic'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Set;': return 'REGISTERED'
  }
}

export function method (methodInfo: MethodInfo) {
  return registryMethod(methodInfo, 'potions')
}
