export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  switch (sig) {
    case '()L' + cls.getClassName() + ';': return 'getInstance'
    case '(Ljava/lang/String;)Ljava/lang/String;': return code.consts.includes('.name') ? 'formatName' : 'format'
    case '(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;': return 'format'
  }
}

export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Properties;': return 'translations'
    case 'L' + cls.getClassName() + ';': return 'instance'
  }
}
