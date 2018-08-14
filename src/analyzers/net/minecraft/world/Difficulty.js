import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case '[L' + clsInfo.obfName + ';': return 'DIFFICULTIES'
    case 'I': return 'id'
    case 'Ljava/lang/String;': return 'name'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const self = clsInfo.obfName
  switch (sig) {
    case '(I)L' + self + ';': return 'forId'
    case '()Ljava/lang/String;': return 'getName'
    case '()I': return 'getId'
  }
  if (code.consts.includes('options.difficulty.')) {
    info.class[code.lines[0].nextOp('new', true).className].name = CLASS.TRANSLATION
    const retType = sig.slice(sig.indexOf(')L') + 2, sig.lastIndexOf(';'))
    info.class[retType].name = CLASS.TEXT_COMPONENT
    return 'getTranslation'
  }
}
