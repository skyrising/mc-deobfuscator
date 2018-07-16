import * as CLASS from '../../../../ClassNames'
import {getReturnType} from '../../../../util'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const name = method.getName()
  if (name !== 'main' && name !== '<clinit>') {
    const retType = getReturnType(method)
    if (retType !== 'V') info.class[retType].name = CLASS.DATA_GENERATOR
  }
}
