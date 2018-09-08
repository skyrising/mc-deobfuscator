// @flow

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo } = fieldInfo
  const Vec3d = clsInfo.obfName
  switch (sig) {
    case 'L' + Vec3d + ';': return 'ZERO'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo } = methodInfo
  if (methodInfo.origName === '<init>' && sig === '(DDD)V') {
    for (const line of code.lines) {
      if (!line.load) continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'xyz'[(line.load - 1) / 2]
    }
  }
}
