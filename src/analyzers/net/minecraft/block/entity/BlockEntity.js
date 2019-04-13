// @flow
import { toUpperCamelCase } from '../../../../../util'
import { signatureTag as s } from '../../../../../util/code'
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.obfName === '<clinit>') {
    for (const c of code.constants) {
      if (c.type !== 'string') continue
      const isOld = /^[A-Z][A-Za-z_\d]+$/.test(c.value)
      if (c.value.length < 4 && c.value !== 'bed' && !isOld) continue
      const isNew = /^[a-z_\d]+$/.test(c.value)
      if (!isOld && !isNew) continue
      const name = isNew ? toUpperCamelCase(c.value) : c.value
      const clsName = isOld ? c.line.previous.constant : c.line.next.constant
      if (!clsName || clsName.type !== 'class') continue
      info.class[clsName.value].name = CLASS.BLOCK_ENTITY + name
      if (isNew && c.line.next.next.call) info.method[c.line.next.next.call.fullSig].name = 'registerBlockEntity'
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.BLOCK}`.matches(fieldInfo)) return 'block'
  if (s`${CLASS.WORLD}`.matches(fieldInfo)) return 'world'
  if (s`${CLASS.BLOCK_POS}`.matches(fieldInfo)) return 'pos'
}
