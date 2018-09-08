// @flow
import * as CLASS from '../../../../ClassNames'

export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  switch (fieldInfo.sig) {
    case '[L' + clsInfo.obfName + ';': return 'DIFFICULTIES'
    case 'I': return 'id'
    case 'Ljava/lang/String;': return 'name'
  }
}

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo, info } = methodInfo
  const self = clsInfo.obfName
  switch (sig) {
    case '(I)L' + self + ';': return 'forId'
    case '()Ljava/lang/String;': return 'getName'
    case '()I': return 'getId'
  }
  if (code.consts.includes('options.difficulty.')) {
    const newTranslation = code.lines[0].nextOp('new', true)
    if (newTranslation) info.class[newTranslation.className].name = CLASS.TRANSLATION
    const retType = sig.slice(sig.indexOf(')L') + 2, sig.lastIndexOf(';'))
    info.class[retType].name = CLASS.TEXT_COMPONENT
    return 'getTranslation'
  }
}
