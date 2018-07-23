export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(DDDDDD)V') {
    for (const line of code.lines) {
      if (!line.load || line.load > 5) continue
      clsInfo.field[line.nextOp('putfield').field.fieldName] = line.nextOp('invokestatic').call.methodName + 'XYZ'[(line.load - 1) / 2]
    }
  }
}
