import {toUnderScoreCase} from '../../../../util'

export function method (methodInfo) {
  if (methodInfo.origName === '<clinit>') {
    for (const line of methodInfo.code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[A-Za-z\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      methodInfo.clsInfo.field[putstatic.field.fieldName] = toUnderScoreCase(name).toUpperCase()
    }
  }
}
