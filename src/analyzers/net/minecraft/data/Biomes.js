// @flow
import * as PKG from '../../../../PackageNames'
import { registryMethod } from '../../../sharedLogic'
import { toUpperCamelCase } from '../../../../util'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'biomes', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const newBiome = line.next
      if (!newBiome || newBiome.op !== 'new') return
      const { className } = ((newBiome: any): CodeLineNew)
      const biomeClass = info.class[className]
      biomeClass.name = PKG.BIOME + '.' + toUpperCamelCase(id)
      const constr = biomeClass.method['<init>:()V']
      if (!constr) {
        return {
          class: biomeClass.name
        }
      }
      return {
        class: biomeClass.name
      }
    }
  })
}
