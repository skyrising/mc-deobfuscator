// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'insertion'
  }
  if (s`${CLASS.TEXT_STYLE}`.matches(fieldInfo)) return fieldInfo.static ? 'ROOT' : 'parent'
  if (s`${CLASS.TEXT_FORMATTING}`.matches(fieldInfo)) return 'color'
  if (s`${CLASS.TEXT_CLICK_EVENT}`.matches(fieldInfo)) return 'click'
  if (s`${CLASS.TEXT_HOVER_EVENT}`.matches(fieldInfo)) return 'hover'
}

export function method (methodInfo: MethodInfo) {
  const { clsInfo } = methodInfo
  if (s`()${CLASS.TEXT_STYLE}`.matches(methodInfo)) {
    if (methodInfo.private) return 'getParent'
    return methodInfo.code.lines[6].op === 'getfield' ? 'copy' : 'computeCopy'
  }
  if (methodInfo.sig === '()Z') methodInfo.getter = true
  else if (s`()${CLASS.TEXT_FORMATTING}`.matches(methodInfo)) methodInfo.getter = true
  else if (s`()${CLASS.TEXT_CLICK_EVENT}`.matches(methodInfo)) methodInfo.getter = true
  else if (s`()${CLASS.TEXT_HOVER_EVENT}`.matches(methodInfo)) methodInfo.getter = true
  if (methodInfo.origName === 'toString') {
    for (const line of methodInfo.code.lines) {
      if (!line.const || typeof line.const === 'number' || !/^, (.+)=$/.test(line.const)) continue
      const name = line.const.match(/^, (.+)=$/)[1]
      if (name === 'bold' || name === 'italic' || name === 'underlined' || name === 'obfuscated') {
        const getfield = line.nextOp('getfield')
        if (!getfield || getfield.field.fullClassName !== clsInfo.obfName) continue
        clsInfo.fields[getfield.field.fieldName].name = name
      }
    }
  }
}
