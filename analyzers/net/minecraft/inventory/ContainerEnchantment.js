
export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Random;': return 'rand'
    case 'I': return 'xpSeed'
  }
}
