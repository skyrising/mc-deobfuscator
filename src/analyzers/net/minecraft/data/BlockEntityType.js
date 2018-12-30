// @flow
import * as PKG from '../../../../PackageNames'
import { registryMethod } from '../../../sharedLogic'
import { toUpperCamelCase } from '../../../../util'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'block_entity_types', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const beClass = info.class[field.genericSignature.simple[0].typeArguments.value[0].value.simple[0].identifier]
      beClass.name = PKG.BLOCK_ENTITY + '.' + toUpperCamelCase(id) + 'BlockEntity'
      return {
        class: beClass
      }
    }
  })
}
