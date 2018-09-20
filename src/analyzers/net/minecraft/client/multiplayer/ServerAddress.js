// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'host'
    case 'I': return 'port'
  }
}

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '(Ljava/lang/String;I)I': return 'parsePort'
    case '(Ljava/lang/String;)L' + methodInfo.clsInfo.obfName + ';': return 'parseString'
    case '(Ljava/lang/String;)[Ljava/lang/String;': return 'getSrvRecord'
    case '()Ljava/lang/String;': return 'getHost'
  }
}
