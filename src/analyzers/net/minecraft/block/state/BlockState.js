import {signatureTag as s} from '../../../../../util/code'
import * as CLASS from '../../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  switch (methodInfo.sig) {
    case '()Ljava/util/Collection;': return 'getPropertyNames'
    case '()Lcom/google/common/collect/ImmutableMap;': return 'getProperties'
  }
  if (s`(${CLASS.BLOCK_PROPERTY}Ljava/lang/Comparable;)${CLASS.BLOCK_STATE}`.matches(methodInfo)) return 'with'
  if (s`(${CLASS.BLOCK_PROPERTY})${CLASS.BLOCK_STATE}`.matches(methodInfo)) return 'cycle'
  if (s`()${CLASS.BLOCK}`.matches(methodInfo)) return 'getBlock'
  if (methodInfo.sig.endsWith(')Ljava/lang/Comparable;')) {
    info.class[method.getArgumentTypes()[0].getClassName()].name = CLASS.BLOCK_PROPERTY
    return 'getValue'
  }
}
