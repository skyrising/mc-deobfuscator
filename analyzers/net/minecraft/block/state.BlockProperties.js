import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  switch (sig) {
    case '()Ljava/util/Collection;': return 'getPropertyNames'
    case '()Lcom/google/common/collect/ImmutableMap;': return 'getProperties'
  }
  const Material = info.classReverse[CLASS.MATERIAL]
  if (!Material) clsInfo.done = false
  if (Material && sig === '()L' + Material + ';') return 'getMaterial'
}
