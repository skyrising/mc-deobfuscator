// @flow
import * as PKG from '../../../../PackageNames'
import * as CLASS from '../../../../ClassNames'
import { toUpperCamelCase } from '../../../../util'
import { registryMethod } from '../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'recipe_serializers', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
        const genericTypeArgument = field.genericSignature.simple[0].typeArguments.value[0]
        const typeClass = info.class[genericTypeArgument.value.simple[0].identifier]
        if (id === 'crafting_special_firework_rocket') info.class[typeClass.superClassName].name = CLASS.RECIPE_CRAFTING_SPECIAL
        const typeName = CLASS['RECIPE_' + id.toUpperCase()] || (!typeClass.isInnerClass && `${PKG.RECIPE}.${toUpperCamelCase(id)}Recipe`)
        if (typeName) typeClass.name = typeName
        return {
          class: typeClass
        }
    }
  })
}
