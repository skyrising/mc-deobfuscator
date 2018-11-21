// @flow
import * as PKG from '../../../../../../PackageNames'
import { registryMethod } from '../../../../../sharedLogic'
import { toUpperCamelCase } from '../../../../../../util'

const STRUCTURE_IDS = new Set([
  'village', 'mineshaft', 'woodland_mansion', 'jungle_temple', 'desert_pyramid',
  'igloo', 'shipwreck', 'swamp_hut', 'stronghold', 'ocean_monument', 'ocean_ruin',
  'nether_bridge', 'end_city', 'buried_treasure', 'pillager_outpost'
])

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'features', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const newFeature = line.next
      if (!newFeature || newFeature.op !== 'new') return
      const { className } = ((newFeature: any): CodeLineNew)
      const pkg = STRUCTURE_IDS.has(id) ? PKG.STRUCTURE : PKG.WORLD_GEN_FEATURE
      info.class[className].name = pkg + '.' + toUpperCamelCase(id)
    }
  })
}
