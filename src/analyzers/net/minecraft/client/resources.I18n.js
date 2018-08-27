export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  switch (sig) {
    case '()L' + cls.getClassName() + ';': return 'getInstance'
    case '(Ljava/lang/String;)Ljava/lang/String;': return code.consts.includes('.name') ? 'formatName' : 'format'
    case '(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;': return 'format'
  }
}

export function field (fieldInfo) {
  const {sig, clsInfo} = fieldInfo
  switch (sig) {
    case 'Ljava/util/Properties;': return 'translations'
    case 'L' + clsInfo.obfName + ';': return 'instance'
  }
}
