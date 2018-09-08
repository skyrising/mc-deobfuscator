// @flow

import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    const newCls = code.lines[0].nextOp('new', true)
    if (newCls && newCls.className && newCls.className.startsWith(clsInfo.obfName + '$')) info.class[newCls.className].name = CLASS.MATERIAL$BUILDER
  }
}

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo, info } = fieldInfo
  const MapColor = info.classReverse[CLASS.MAP_COLOR]
  const PistonBehavior = info.classReverse[CLASS.PISTON_BEHAVIOR]
  if (!MapColor || !PistonBehavior) clsInfo.done = false
  if (MapColor && sig === 'L' + MapColor + ';') return 'mapColor'
  if (PistonBehavior && sig === 'L' + PistonBehavior + ';') return 'pistonBehavior'
}
