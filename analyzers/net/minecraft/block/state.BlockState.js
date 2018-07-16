import * as CLASS from '../../../../ClassNames'

export function cls (cls, clsInfo, info) {
  const ifs = cls.getInterfaces()
  if (ifs.length === 2) {
    info.class[ifs[0].getClassName()].name = CLASS.BLOCK_BEHAVIORS
    info.class[ifs[1].getClassName()].name = CLASS.BLOCK_PROPERTIES
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  switch (sig) {
    case '()Ljava/util/Collection;': return 'getPropertyNames'
    case '()Lcom/google/common/collect/ImmutableMap;': return 'getProperties'
  }
  const Block = info.classReverse['net.minecraft.block.Block']
  const Property = info.classReverse['net.minecraft.block.state.Property']
  if (!Block || !Property) clsInfo.done = false
  if (Block && sig === '()L' + Block + ';') return 'getBlock'
  if (sig.endsWith(')Ljava/lang/Comparable;')) {
    info.class[method.getArgumentTypes()[0].getClassName()].name = 'net.minecraft.block.state.Property'
    return 'getValue'
  }
  if (sig.endsWith('Ljava/lang/Comparable;)L' + cls.getClassName() + ';')) return 'withProperty'
  if (sig === '(L' + Property + ';)L' + cls.getClassName() + ';') return 'cycleProperty'
}
