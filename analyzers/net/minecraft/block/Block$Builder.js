import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const args = method.getArgumentTypes()
  const name = method.getName()
  if (name === '<init>' && args.length === 2 && sig.startsWith('(L')) {
    info.class[args[0].getClassName()].name = CLASS.MATERIAL
    info.class[args[1].getClassName()].name = CLASS.MAP_COLOR
  }
}
