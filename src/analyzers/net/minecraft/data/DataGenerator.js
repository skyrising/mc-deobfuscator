import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo) {
  const {sig} = fieldInfo
  switch (sig) {
    case 'Ljava/util/Collection;': return 'inputPaths'
    case 'Ljava/nio/file/Path;': return 'outputPath'
    case 'Ljava/util/List;': return 'providers'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (sig.startsWith('(L') && sig.endsWith(';)V')) {
    info.class[methodInfo.args[0].getClassName()].name = CLASS.DATA_PROVIDER
    return 'addProvider'
  }
  if (sig === '()V' && !methodInfo.origName.endsWith('init>')) return 'generate'
}
