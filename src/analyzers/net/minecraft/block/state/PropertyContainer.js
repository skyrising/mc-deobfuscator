// @flow

import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { clsInfo, info } = methodInfo
  switch (methodInfo.sig) {
    case '()Ljava/util/Collection;': return 'getPropertyNames'
    case '()Lcom/google/common/collect/ImmutableMap;': return 'getProperties'
  }
  const Material = info.classReverse[CLASS.MATERIAL]
  if (!Material) clsInfo.done = false
  if (Material && methodInfo.sig === '()L' + Material + ';') return 'getMaterial'
}
