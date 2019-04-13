// @flow
import { toStringFieldNamer } from '../../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.obfName === 'toString') return toStringFieldNamer(methodInfo)
}
