// @flow
import { toUnderScoreCase } from '../../../../util'

export function method (methodInfo: MethodInfo) {
  if (methodInfo.obfName === '<clinit>') {
    for (const line of methodInfo.code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[A-Za-z\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      methodInfo.clsInfo.fields[putstatic.field.fieldName].name = toUnderScoreCase(name).toUpperCase()
    }
  }
}
