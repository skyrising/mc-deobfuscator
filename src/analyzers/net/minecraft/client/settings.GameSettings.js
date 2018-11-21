// @flow

import * as CLASS from '../../../../ClassNames'
import { toLowerCamelCase } from '../../../../util'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { code, sig, clsInfo } = methodInfo
  if (sig === '()V' && code.consts.includes('mouseSensitivity')) {
    for (const line of code.lines) {
      if (typeof line.const !== 'string' || line.const === 'true') continue
      if ((!line.next.call || line.next.call.methodName !== 'equals') &&
          (!line.next.next.call || line.next.next.call.methodName !== 'equals')) continue
      const putfield = line.nextOp('putfield')
      if (putfield) clsInfo.fields[putfield.field.fieldName].name = line.const
    }
    return 'loadOptions'
  }
  if (methodInfo.obfName === '<init>') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string' || !line.const.startsWith('key.') || line.previous.op !== 'dup') continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = toLowerCamelCase(line.const.split('.'))
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  if (fieldInfo.sig === 'Ljava/io/File;') return 'file'
  if (s`${CLASS.MINECRAFT}`.matches(fieldInfo)) return 'minecraft'
  if (s`[${CLASS.KEY_BINDING}`.matches(fieldInfo)) return 'keyBindings'
}
