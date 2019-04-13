// @flow
import * as PKG from '../../../../PackageNames'
import * as CLASS from '../../../../ClassNames'
import { toUpperCamelCase } from '../../../../util'
import { registryMethod } from '../../../sharedLogic'

const CONTAINER_CLASSES = {
  generic_9x3: CLASS.GENERIC_CONTAINER$GENERIC_9X3,
  generic_9x6: CLASS.GENERIC_CONTAINER$GENERIC_9X6,
  crafting: CLASS.CRAFTING_TABLE_CONTAINER,
  cartography: CLASS.CARTOGRAPHY_TABLE_CONTAINER
}

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'menus', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
        const genericTypeArgument = field.genericSignature.simple[0].typeArguments.value[0]
        const typeClass = info.class[genericTypeArgument.value.simple[0].identifier]
        const typeName = CONTAINER_CLASSES[id] || (!typeClass.isInnerClass && `${PKG.CONTAINER}.${toUpperCamelCase(id)}Container`)
        if (typeName) typeClass.name = typeName
        return {
          class: typeClass
        }
    }
  })
}
