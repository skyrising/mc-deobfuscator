import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const args = method.getArgumentTypes()
  const Builder = clsInfo.obfName
  if (methodInfo.name === '<init>' && args.length === 2 && sig.startsWith('(L')) {
    info.class[args[0].getClassName()].name = CLASS.MATERIAL
    info.class[args[1].getClassName()].name = CLASS.MAP_COLOR
  }
  if (sig.endsWith(')L' + Builder + ';') && method.isStatic()) return 'create'
  switch (sig) {
    case '(I)L' + Builder + ';': return 'setLightOpacity'
    case '(FF)L' + Builder + ';': return 'setHardnessAndResistance'
    case '(F)L' + Builder + ';': {
      if (code.lines[2] && code.lines[2].field) return 'setSlipperiness'
      return 'setHardnessAndResistance'
    }
  }
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  const MapColor = info.classReverse[CLASS.MAP_COLOR]
  if (!MapColor) clsInfo.done = false
  if (MapColor && sig === 'L' + MapColor + ';') return 'mapColor'
  switch (sig) {
    case 'I': return 'lightOpacity'
  }
}
