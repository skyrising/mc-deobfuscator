// @flow

export function method (methodInfo: MethodInfo) {
  const {sig, code, clsInfo} = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(II)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'xz'[line.load - 1]
    }
  }
}
