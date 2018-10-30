// @flow
import { registryMethod } from '../../../../../registryBootstrapper'

export function method (methodInfo: MethodInfo) {
  return registryMethod(methodInfo, 'features')
}
