// @flow
import { signatureTag as s } from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'
import { registerBlocks } from '../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo, info } = methodInfo
  const Block = clsInfo.obfName
  if (code.consts.includes('cobblestone')) {
    registerBlocks(methodInfo)
    return 'registerBlocks'
  }
  if (code.consts.includes('Don\'t know how to convert ') && code.consts.includes(' back into data...')) {
    methodInfo.name = 'getMetaFromState'
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.BLOCK_STATE
  }
  if (methodInfo.obfName === '<init>' && methodInfo.args.length === 2 && sig.startsWith('(L')) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.MATERIAL
  }
  if (methodInfo.obfName === '<init>' && methodInfo.args.length === 1) {
    const arg0 = methodInfo.argSigs[0].slice(1, -1)
    info.class[arg0].name = arg0.includes('$') ? CLASS.BLOCK$BUILDER : CLASS.MATERIAL
  }
  if (methodInfo.obfName === '<clinit>') {
    for (const c of code.constants) {
      if (c.type !== 'string' || c.value !== 'air') continue
      const newIdentifier = c.line.prevOp('new')
      if (newIdentifier) info.class[newIdentifier.className].name = CLASS.RESOURCE_LOCATION
    }
  }
  if (s`(DDDDDD)${CLASS.VOXEL_SHAPE}`.matches(methodInfo)) return 'createShape'
  if (s`()${CLASS.BLOCK_RENDER_LAYER}`.matches(methodInfo)) return 'getRenderLayer'
  if (s`${CLASS.HIT_RESULT}`.matches(methodInfo)) return 'rayTrace'
  if (s`${CLASS.PISTON_BEHAVIOR}`.matches(methodInfo)) return 'getPistonBehavior'
  if (s`${CLASS.BLOCK_RENDER_TYPE}`.matches(methodInfo)) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.BLOCK_STATE
    return 'getRenderType'
  }
  switch (sig) {
    case '(Ljava/lang/String;L' + Block + ';)V': return 'registerBlock'
  }
  for (const c of code.constants) {
    if (c.type !== 'string') continue
    switch (c.value) {
      case 'doTileDrops': {
        if (methodInfo.flags.static) return 'dropAsItem'
        return 'dropExperience'
      }
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'name'
    case 'I': return 'lightOpacity'
  }
  if (s`${CLASS.MAP_COLOR}`.matches(fieldInfo)) return 'mapColor'
  if (s`${CLASS.REGISTRY}`.matches(fieldInfo)) return 'REGISTRY'
  if (s`${CLASS.BLOCK_STATE}`.matches(fieldInfo)) return 'defaultBlockState'
}
