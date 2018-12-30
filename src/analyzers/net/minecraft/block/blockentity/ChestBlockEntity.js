// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { clsInfo, info } = methodInfo
  if (methodInfo.obfName === '<init>') {
    for (const c of methodInfo.code.constants) {
      if (c.value !== 27) continue
      const getAirStack = c.line.next
      if (!getAirStack || getAirStack.op !== 'getstatic') continue
      info.class[getAirStack.field.className].fields[getAirStack.field.fieldName].name = 'AIR'
      const invokeCreate = getAirStack.next
      if (!invokeCreate || invokeCreate.op !== 'invokestatic') continue
      const NonNullListCls = info.class[invokeCreate.call.className]
      NonNullListCls.name = CLASS.NON_NULL_LIST
      NonNullListCls.method[invokeCreate.call.methodName + ':' + invokeCreate.call.signature].name = 'create'
      const putInventory = invokeCreate.next
      if (!putInventory || putInventory.op !== 'putfield') continue
      clsInfo.field[putInventory.field.fieldName].name = 'inventory'
    }
  }
}
