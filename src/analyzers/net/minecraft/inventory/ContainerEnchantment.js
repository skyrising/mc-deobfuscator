// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Random;': return 'rand'
    case 'I': return 'xpSeed'
  }
}
