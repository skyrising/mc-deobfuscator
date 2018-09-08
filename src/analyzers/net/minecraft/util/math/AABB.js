// @flow

export function method (methodInfo: MethodInfo) {
  const {sig, code, clsInfo} = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(DDDDDD)V') {
    for (const line of code.lines) {
      if (!line.load || line.load > 5) continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = line.nextOp('invokestatic').call.methodName + 'XYZ'[(line.load - 1) / 2]
    }
  }
}
