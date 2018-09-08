// @flow

export function method (methodInfo: MethodInfo) {
  const { code, sig, clsInfo } = methodInfo
  switch (sig) {
    case '()L' + clsInfo.obfName + ';': return 'getInstance'
    case '(Ljava/lang/String;)Ljava/lang/String;': return code.consts.includes('.name') ? 'formatName' : 'format'
    case '(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;': return 'format'
  }
}

export function field (fieldInfo: FieldInfo) {
  const { sig, clsInfo } = fieldInfo
  switch (sig) {
    case 'Ljava/util/Properties;': return 'translations'
    case 'L' + clsInfo.obfName + ';': return 'instance'
  }
}
