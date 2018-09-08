// @flow

export function field (fieldInfo: FieldInfo) {
  const { sig } = fieldInfo
  switch (sig) {
    case 'Ljava/util/Random;': return 'rand'
    case 'I': return 'xpSeed'
  }
}
