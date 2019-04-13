// @flow
import * as CLASS from '../../../../../ClassNames'
import { toLowerCamelCase } from '../../../../../util'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  if (!NBTCompound) clsInfo.done = false
  if (NBTCompound && methodInfo.sig === '(L' + NBTCompound + ';)V') {
    for (const c of code.constants) {
      if (c.type !== 'string') continue
      const next = c.line.next
      if (!next || !('call' in next)) continue
      const putfield = next.next
      if (!putfield || putfield.op !== 'putfield') continue
      clsInfo.fields[putfield.field.fieldName].name = toLowerCamelCase(c.value)
    }
    return 'readFromNBT'
  }
  if (NBTCompound && methodInfo.sig === '(L' + NBTCompound + ';)L' + NBTCompound + ';') return 'writeToNBT'
}
