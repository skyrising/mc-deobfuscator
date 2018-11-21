// @flow
import * as PKG from '../../../../../../PackageNames'
import { registryMethod } from '../../../../../sharedLogic'
import { toUpperCamelCase } from '../../../../../../util'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'carvers', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const newCarver = line.next
      if (!newCarver || newCarver.op !== 'new') return
      const { className } = ((newCarver: any): CodeLineNew)
      const carverClass = info.class[className]
      carverClass.name = PKG.WORLD_GEN_CARVING + '.' + toUpperCamelCase(id)
      return {
        class: carverClass.name
      }
    }
  })
}
