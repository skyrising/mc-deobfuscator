// @flow
import * as CLASS from '../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { code, argSigs, info } = methodInfo
  for (const line of code.lines) {
    if (!line.const) continue
    switch (line.const) {
      case 'Exception initializing level':
        info.class[argSigs[0].slice(1, -1)].name = CLASS.WORLD_SETTINGS
        return 'initialize'
      case 'Tried to add entity {} but it was marked as removed already':
      case 'Keeping entity {} that already exists with UUID {}':
        return 'addEntity'
      case 'Force-added player with duplicate UUID {}':
        return 'addPlayer'
      // case 'Removing entity while ticking!':
      //  return 'removeEntity'
      case 'scoreboard':
        return 'init'
      case 'tickPending':
        return 'tick'
      case 'Ticking player': return 'tickPlayers'
      case 'TickNextTick list out of synch': return 'processScheduledTicks'
    }
  }
}
