import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  const WorldType = info.classReverse[CLASS.WORLD_TYPE]
  const GameRules = info.classReverse[CLASS.GAME_RULES]
  const Difficulty = info.classReverse[CLASS.DIFFICULTY]
  if (!WorldType || !GameRules) clsInfo.done = false
  if (WorldType && sig === 'L' + WorldType + ';') return 'worldType'
  if (GameRules && sig === 'L' + GameRules + ';') return 'gameRules'
  if (Difficulty && sig === 'L' + Difficulty + ';') return field.isStatic() && field.isFinal() ? 'DEFAULT_DIFFICULTY' : 'difficulty'
}

/*
export function method (cls, method, code, methodInfo, clsInfo, info) {
}
*/
