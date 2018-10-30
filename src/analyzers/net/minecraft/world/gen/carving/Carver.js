// @flow
import { registryMethod } from '../../../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  return registryMethod(methodInfo, 'carvers')
}
