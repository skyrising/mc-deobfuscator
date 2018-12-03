// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.code.consts.includes('checkDespawn')) {
    for (const c of methodInfo.code.constants) {
      if (c.value === 'checkDespawn') {
        const call = c.line.next
        // TODO:
      }
    }
    return 'updateActionState'
  }
}
