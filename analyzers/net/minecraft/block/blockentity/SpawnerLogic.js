import * as CLASS from '../../../../../ClassNames'
import {toLowerCamelCase} from '../../../../../util'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  switch (methodInfo.sig) {}
  const NBTCompound = info.classReverse[CLASS.NBT_COMPOUND]
  if (!NBTCompound) clsInfo.done = false
  if (NBTCompound && methodInfo.sig === '(L' + NBTCompound + ';)V') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!line.next.call) continue
      if (line.next.next.op !== 'putfield') continue
      clsInfo.field[line.next.next.field.fieldName] = toLowerCamelCase(line.const)
    }
    return 'readFromNBT'
  }
  if (NBTCompound && methodInfo.sig === '(L' + NBTCompound + ';)L' + NBTCompound + ';') return 'writeToNBT'
}
