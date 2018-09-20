// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { argSigs, retSig, code, clsInfo, info } = methodInfo
  if (argSigs.length === 2 && argSigs[0] === 'I' && argSigs[1].startsWith('L') && retSig === 'V') {
    info.class[argSigs[1].slice(1, -1)].name = CLASS.AI_GOAL
    const newEntry = code.lines[0].nextOp('new')
    if (newEntry && newEntry.className.startsWith(clsInfo.obfName + '$')) info.class[newEntry.className].name = CLASS.AI_GOALS$ENTRY
    const getEntries = code.lines[0].nextOp('getfield')
    if (getEntries) clsInfo.fields[getEntries.field.fieldName].name = 'entries'
    return 'addGoal'
  }
}
