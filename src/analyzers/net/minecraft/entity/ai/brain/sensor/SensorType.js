// @flow
import * as PKG from '../../../../../../../PackageNames'
import * as CLASS from '../../../../../../../ClassNames'
import { registryMethod } from '../../../../../../sharedLogic'
import { toUpperCamelCase } from '../../../../../../../util'

export function method (methodInfo: MethodInfo) {
  return registryMethod(methodInfo, 'sensor_types', {
    eval (id, line, field) {
      let typeClass
      try {
        const genericTypeArgument = field.genericSignature.simple[0].typeArguments.value[0]
        typeClass = info.class[genericTypeArgument.value.simple[0].identifier]
        typeClass.setName(PKG.AI_SENSOR + '.' + toUpperCamelCase(id) + 'Sensor', 'registry')
        info.class[typeClass.superClassName].setName(CLASS.SENSOR, 'super')
      } catch (e) {
        console.error(e)
      }
      return { class: typeClass }
    }
  })
}
