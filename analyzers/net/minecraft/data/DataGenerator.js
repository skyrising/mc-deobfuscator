import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Collection;': return 'inputPaths'
    case 'Ljava/nio/file/Path;': return 'outputPath'
    case 'Ljava/util/List;': return 'providers'
  }
  if (sig === '[L' + clsInfo.obfName + ';') return 'WORLD_TYPES'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  if (sig.startsWith('(L') && sig.endsWith(';)V')) {
    info.class[method.getArgumentTypes()[0].getClassName()].name = CLASS.DATA_PROVIDER
    return 'addProvider'
  }
  if (sig === '()V' && !method.getName().endsWith('init>')) return 'generate'
}
