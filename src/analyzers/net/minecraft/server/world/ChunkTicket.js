// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'I': return 'level'
    case 'Ljava/lang/Object;': return 'argument'
    case 'J': return 'location'
  }
  if (s`${CLASS.CHUNK_TICKET_TYPE}`.matches(fieldInfo)) return 'type'
}

export function method (methodInfo: MethodInfo) {
  if (methodInfo.obfName === '<init>') return '<init>(type,level,argument,location)'
}
