// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const {sig, code, clsInfo, info} = methodInfo
  if (methodInfo.origName === '<clinit>') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_\d/]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.fields[putstatic.field.fieldName].name = name.slice(name.indexOf('/') + 1).replace(/\//g, '_').toUpperCase()
    }
    return
  }
  const ResourceLocation = info.classReverse[CLASS.RESOURCE_LOCATION]
  if (!ResourceLocation) clsInfo.done = false
  if (ResourceLocation && sig.endsWith('L' + ResourceLocation + ';')) return 'registerLootTable'
}
