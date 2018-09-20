// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { clsInfo } = methodInfo
  const { lines } = methodInfo.code
  if (methodInfo.origName === '<clinit>') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (typeof line.const !== 'string') continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) break
      clsInfo.fields[putstatic.field.fieldName].name = name.toUpperCase()
      i = lines.indexOf(putstatic)
    }
    return
  }
  if (methodInfo.static && s`(Ljava/lang/String;${CLASS.REGISTRY})${CLASS.REGISTRY}`.matches(methodInfo)) {
    const getstatic = lines[0].nextOp('getstatic', true)
    if (getstatic) clsInfo.fields[getstatic.field.fieldName].name = 'ROOT'
    return 'registerRegistry'
  }
  switch (methodInfo.sig) {
    case '()Ljava/util/Set;': return 'keys'
    case '(Ljava/util/Random;)Ljava/lang/Object;': return 'getRandom'
    case '()Z': return 'isEmpty'
  }
  if (s`(I${CLASS.RESOURCE_LOCATION}Ljava/lang/Object;)V`.matches(methodInfo)) return 'put'
  if (s`(${CLASS.RESOURCE_LOCATION}Ljava/lang/Object;)V`.matches(methodInfo)) return 'put'
  // if (s`(${CLASS.RESOURCE_LOCATION})Ljava/lang/Object;`.matches(methodInfo)) return 'get'
  if (s`(I)Ljava/lang/Object;`.matches(methodInfo)) return 'get'
}
