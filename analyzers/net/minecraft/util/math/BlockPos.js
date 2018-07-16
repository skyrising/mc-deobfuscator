import * as CLASS from '../../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  info.class[cls.getSuperclassName()].name = CLASS.VEC_3I
}

export function field (field, clsInfo, info) {
  const BlockPos = clsInfo.obfName
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'L' + BlockPos + ';': return 'ORIGIN'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const BlockPos = clsInfo.obfName
  switch (sig) {
    case '()J': return 'toLong'
    case '(J)L' + BlockPos + ';': return 'fromLong'
  }
}
