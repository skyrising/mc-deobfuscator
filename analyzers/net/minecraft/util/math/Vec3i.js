export function field (field, clsInfo, info) {
  const Vec3i = clsInfo.obfName
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'L' + Vec3i + ';': return 'ZERO'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  if (method.getName() === '<init>' && sig === '(III)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.field[line.nextOp('putfield').field.fieldName] = 'xyz'[line.load - 1]
    }
  }
}
