import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const Builder = clsInfo.obfName
  if (methodInfo.name === '<init>' && methodInfo.args.length === 2 && sig.startsWith('(L')) {
    info.class[methodInfo.args[0].getClassName()].name = CLASS.MATERIAL
    info.class[methodInfo.args[1].getClassName()].name = CLASS.MAP_COLOR
  }
  if (sig.endsWith(')L' + Builder + ';') && methodInfo.static) return 'create'
  switch (sig) {
    case '(I)L' + Builder + ';': return 'setLightOpacity'
    case '(FF)L' + Builder + ';': return 'setHardnessAndResistance'
    case '(F)L' + Builder + ';': {
      if (code.lines[2] && code.lines[2].field) return 'setSlipperiness'
      return 'setHardnessAndResistance'
    }
  }
}

export function field (fieldInfo) {
  const {sig, clsInfo, info} = fieldInfo
  const MapColor = info.classReverse[CLASS.MAP_COLOR]
  const Material = info.classReverse[CLASS.MATERIAL]
  if (!MapColor || !Material) clsInfo.done = false
  if (MapColor && sig === 'L' + MapColor + ';') return 'mapColor'
  if (Material && sig === 'L' + Material + ';') return 'material'
  switch (sig) {
    case 'I': return 'lightOpacity'
  }
}
