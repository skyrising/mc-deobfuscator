// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Map;': return 'SPAWN_CONDITIONS'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, retSig } = methodInfo
  if (retSig === 'V') return 'register'
}
