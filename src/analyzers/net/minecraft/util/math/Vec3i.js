
export function field (fieldInfo) {
  const {sig, clsInfo} = fieldInfo
  const Vec3i = clsInfo.obfName
  switch (sig) {
    case 'L' + Vec3i + ';': return 'ZERO'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(III)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.field[line.nextOp('putfield').field.fieldName] = 'xyz'[line.load - 1]
    }
  }
}
