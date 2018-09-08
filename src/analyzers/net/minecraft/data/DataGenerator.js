// @flow

import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Collection;': return 'inputPaths'
    case 'Ljava/nio/file/Path;': return 'outputPath'
    case 'Ljava/util/List;': return 'providers'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, info } = methodInfo
  if (sig.startsWith('(L') && sig.endsWith(';)V')) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.DATA_PROVIDER
    return 'addProvider'
  }
  if (sig === '()V' && !methodInfo.origName.endsWith('init>')) return 'generate'
}
