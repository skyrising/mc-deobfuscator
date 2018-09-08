// @flow

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo } = fieldInfo
  const Vec3i = clsInfo.obfName
  switch (sig) {
    case 'L' + Vec3i + ';': return 'ZERO'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo } = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(III)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'xyz'[line.load - 1]
    }
  }
}
