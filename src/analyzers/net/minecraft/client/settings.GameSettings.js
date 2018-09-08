// @flow

import * as CLASS from '../../../../ClassNames'
import {toLowerCamelCase} from '../../../../util'

export function method (methodInfo: MethodInfo) {
  const {code, sig, clsInfo} = methodInfo
  if (sig === '()V' && code.consts.includes('mouseSensitivity')) {
    for (const line of code.lines) {
      if (typeof line.const !== 'string' || line.const === 'true') continue
      if ((!line.next.call || line.next.call.methodName !== 'equals') &&
          (!line.next.next.call || line.next.next.call.methodName !== 'equals')) continue
      const putfield = line.nextOp('putfield')
      clsInfo.fields[putfield.field.fieldName].name = line.const
    }
    return 'loadOptions'
  }
  if (methodInfo.origName === '<init>') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string' || !line.const.startsWith('key.') || line.previous.op !== 'dup') continue
      clsInfo.fields[line.nextOp('putfield').field.fieldName].name = toLowerCamelCase(line.const.split('.'))
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  const {sig, clsInfo, info} = fieldInfo
  const Minecraft = info.classReverse[CLASS.MINECRAFT]
  const KeyBinding = info.classReverse[CLASS.KEY_BINDING]
  if (!Minecraft || !KeyBinding) clsInfo.done = false
  if (Minecraft && sig === 'L' + Minecraft + ';') return 'minecraft'
  if (KeyBinding && sig === '[L' + KeyBinding + ';') return 'keyBindings'
  if (sig === 'Ljava/io/File;') return 'file'
}
