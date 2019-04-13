// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/function/Predicate;': return 'NON_EMPTY'
    case 'Lit/unimi/dsi/fastutil/ints/IntList;': return 'ids'
  }
  if (s`${CLASS.INGREDIENT}`.matches(fieldInfo)) return 'EMPTY'
  // TODO: fix matching of arrays with obfuscated type
  if (s`[${CLASS.ITEM_STACK}`.matches(fieldInfo)) return 'stackArray'
  if (s`[${CLASS.INGREDIENT$ENTRY}`.matches(fieldInfo)) return 'entries'
}

export function method (methodInfo: MethodInfo) {
  const { info, code, clsInfo } = methodInfo
  switch (methodInfo.sig) {
    case '()Lit/unimi/dsi/fastutil/ints/IntList;': return 'getIds'
    case '()Z': return 'isEmpty'
    case '()V': return 'createStackArray'
  }
  if (s`(Lcom/google/gson/JsonElement;)${CLASS.INGREDIENT}`.matches(methodInfo)) return 'fromJson'
  if (s`(${CLASS.PACKET_BUFFER})V`.matches(methodInfo)) return 'write(buf)'
  if (s`(${CLASS.PACKET_BUFFER})${CLASS.INGREDIENT}`.matches(methodInfo)) return 'fromPacket(buf)'
  if (s`(Ljava/util/stream/Stream;)${CLASS.INGREDIENT}`.matches(methodInfo)) return 'ofEntries'
  if (s`([${CLASS.ITEM_STACK})${CLASS.INGREDIENT}`.matches(methodInfo)) return 'ofStacks'
  if (s`([${CLASS.ITEMIZABLE})${CLASS.INGREDIENT}`.matches(methodInfo)) return 'ofItems'
  if (code.consts.includes('An ingredient entry needs either a tag or an item')) {
    info.class[methodInfo.retSig.slice(1, -1)].name = CLASS.INGREDIENT$ENTRY
    for (const c of code.constants) {
      if (c.value === 'item') {
        const newStackEntry = c.line.nextOp('new')
        if (!newStackEntry) continue
        const stackEntryClass = info.class[newStackEntry.className]
        if (stackEntryClass.outerClassName === clsInfo.obfName) stackEntryClass.name = CLASS.INGREDIENT$STACK_ENTRY
      } else if (c.value === 'Unknown item tag \'') {
        const newTagEntry = c.line.nextOp('new')
        if (!newTagEntry) continue
        info.class[newTagEntry.className].name = CLASS.INGREDIENT$TAG_ENTRY
      }
    }
    return 'entryFromJson'
  }
}
