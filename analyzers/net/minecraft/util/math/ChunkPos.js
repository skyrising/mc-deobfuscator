export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(II)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.field[line.nextOp('putfield').field.fieldName] = 'xz'[line.load - 1]
    }
  }
}
