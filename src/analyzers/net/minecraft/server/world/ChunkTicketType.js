// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'name'
    case 'Ljava/util/Comparator;': return 'argumentComparator'
  }
}

export function method (methodInfo: MethodInfo) {
  const { clsInfo, code } = methodInfo
  if (methodInfo.obfName === '<clinit>') {
    for (const c of code.constants) {
      if (c.type !== 'string') continue;
      const putstatic = c.line.nextOp('putstatic')
      if (putstatic) clsInfo.fields[putstatic.field.fieldName].name = c.value.toUpperCase()
    }
  }
  if (s`(Ljava/lang/String;Ljava/util/Comparator;)${CLASS.CHUNK_TICKET_TYPE}`.matches(methodInfo)) return 'create(name,comparator)'
}
