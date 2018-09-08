// @flow
import { signatureTag as s } from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  if (s`(Ljava/lang/Class;Ljava/util/function/Function;)${CLASS.ENTITIES$BUILDER}`.matches(methodInfo)) return 'create'
  if (s`(Ljava/lang/Class;)${CLASS.ENTITIES$BUILDER}`.matches(methodInfo)) return 'create'
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/Class;': return 'entityClass'
    case 'Ljava/util/function/Function;': return 'constructor'
  }
}
