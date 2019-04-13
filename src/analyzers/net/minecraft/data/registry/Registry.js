// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'
import { registryMethod } from '../../../../sharedLogic'

const REGISTRY_CLASSES = {
  menu: CLASS.CONTAINER_TYPE,
  menus: CLASS.CONTAINER_TYPE,
  recipe_type: CLASS.RECIPE_TYPE,
  recipe_serializers: CLASS.RECIPE_SERIALIZER
}

export function method (methodInfo: MethodInfo) {
  const { clsInfo, info } = methodInfo
  const { lines } = methodInfo.code
  if (registryMethod(methodInfo, 'registries', {
    eval (id, line, field) {
      if (id === 'custom_stat') return
      let typeClass
      try {
        const genericTypeArgument = field.genericSignature.simple[0].typeArguments.value[0]
        typeClass = info.class[genericTypeArgument.value.simple[0].identifier]
        const typeName = REGISTRY_CLASSES[id] || CLASS[field.name]
        if (typeName) typeClass.name = typeName
      } catch (e) {
        console.error(e)
      }
      let registryClass
      try {
        const supplierNameAndType = line.nextOp('invokedynamic').invokeDynamic.bootstrapMethod.args[1].ref.nameAndType
        const supplier = clsInfo.method[supplierNameAndType.name + ':' + supplierNameAndType.descriptor]
        const supplierLines = supplier.code.lines
        if (supplierLines[0].op === 'getstatic') {
          const field = supplierLines[0].field
          if (field.type !== `L${field.fullClassName};`) {
            registryClass = info.class[field.fullClassName]
            const pluralId = id + 's'
            const listName = REGISTRY_CLASSES[pluralId] || CLASS[pluralId.toUpperCase()]
            if (listName) registryClass.name = listName
          }
        }
      } catch (e) {
        console.error(e)
      }
      return {
        type: typeClass,
        registry: registryClass
      }
    }
  })) return
  if (methodInfo.flags.static && s`(Ljava/lang/String;${CLASS.REGISTRY})${CLASS.REGISTRY}`.matches(methodInfo)) {
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
