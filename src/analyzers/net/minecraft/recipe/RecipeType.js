// @flow
import * as PKG from '../../../../PackageNames'
import * as CLASS from '../../../../ClassNames'
import { toUpperCamelCase } from '../../../../util'
import { registryMethod } from '../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'recipe_types', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
        const genericTypeArgument = field.genericSignature.simple[0].typeArguments.value[0]
        const typeClass = info.class[genericTypeArgument.value.simple[0].identifier]
        if (id === 'smelting') info.class[typeClass.superClassName].name = CLASS.RECIPE_COOKING
        else if (id === 'stonecutting') info.class[typeClass.superClassName].name = CLASS.RECIPE_STONECUTTING_BASE
        const typeName = CLASS['RECIPE_' + id.toUpperCase()] || (!typeClass.isInnerClass && `${PKG.RECIPE}.${toUpperCamelCase(id)}Recipe`)
        if (typeName) typeClass.name = typeName
        return {
          class: typeClass
        }
    }
  })
}
