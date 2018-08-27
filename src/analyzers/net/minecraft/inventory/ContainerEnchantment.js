
export function field (fieldInfo) {
  const {sig} = fieldInfo
  switch (sig) {
    case 'Ljava/util/Random;': return 'rand'
    case 'I': return 'xpSeed'
  }
}
