// @flow
import { toUpperCamelCase } from '../../../../../util'
import { signatureTag as s } from '../../../../../util/code'
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      const isOld = /^[A-Z][A-Za-z_\d]+$/.test(line.const)
      if (line.const.length < 4 && line.const !== 'bed' && !isOld) continue
      const isNew = /^[a-z_\d]+$/.test(line.const)
      if (!isOld && !isNew) continue
      const name = isNew ? toUpperCamelCase(line.const) : line.const
      const clsName = isOld ? line.previous.const : line.next.const
      if (!clsName) continue
      info.class[clsName].name = CLASS.BLOCK_ENTITY + name
      if (isNew && line.next.next.call) info.method[line.next.next.call.fullSig].name = 'registerBlockEntity'
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.BLOCK}`.matches(fieldInfo)) return 'block'
  if (s`${CLASS.WORLD}`.matches(fieldInfo)) return 'world'
  if (s`${CLASS.BLOCK_POS}`.matches(fieldInfo)) return 'pos'
}
