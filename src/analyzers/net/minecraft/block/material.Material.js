import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (methodInfo.origName === '<clinit>') {
    const newCls = code.lines[0].nextOp('new', true)
    if (newCls && newCls.className.startsWith(clsInfo.obfName + '$')) info.class[newCls.className].name = CLASS.MATERIAL$BUILDER
  }
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  const MapColor = info.classReverse[CLASS.MAP_COLOR]
  const PistonBehavior = info.classReverse[CLASS.PISTON_BEHAVIOR]
  if (!MapColor || !PistonBehavior) clsInfo.done = false
  if (MapColor && sig === 'L' + MapColor + ';') return 'mapColor'
  if (PistonBehavior && sig === 'L' + PistonBehavior + ';') return 'pistonBehavior'
}