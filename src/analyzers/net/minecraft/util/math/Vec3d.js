// @flow

export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  switch (fieldInfo.sig) {
    case 'L' + clsInfo.obfName + ';': return 'ZERO'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo } = methodInfo
  if (methodInfo.obfName === '<init>' && sig === '(DDD)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'xyz'[(line.load - 1) / 2]
    }
  }
}
