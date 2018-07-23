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
  const {sig} = methodInfo
  if (methodInfo.static && sig.endsWith(')Z')) {
    info.class[methodInfo.args[0].getClassName()].name = CLASS.BLOCK_STATE
    return 'canFallThrough'
  }
}
