// @flow
import * as CLASS from '../../../../../ClassNames'
import { toLowerCamelCase } from '../../../../../util'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  if (!NBTCompound) clsInfo.done = false
  if (NBTCompound && methodInfo.sig === '(L' + NBTCompound + ';)V') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!line.next.call) continue
      if (line.next.next.op !== 'putfield') continue
      clsInfo.fields[line.next.next.field.fieldName].name = toLowerCamelCase(line.const)
    }
    return 'readFromNBT'
  }
  if (NBTCompound && methodInfo.sig === '(L' + NBTCompound + ';)L' + NBTCompound + ';') return 'writeToNBT'
}
