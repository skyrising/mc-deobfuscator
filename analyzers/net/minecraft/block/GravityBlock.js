import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Z': return 'fallsInstantly'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (code.lines.length === 2 && code.lines[0].const === 2 && code.lines[1].return) {
    return 'tickDelay'
  }
  const sig = method.getSignature()
  if (method.isStatic() && sig.endsWith(')Z')) {
    info.class[method.getArgumentTypes()[0].getClassName()].name = CLASS.BLOCK_STATE
    return 'canFallThrough'
  }
}
