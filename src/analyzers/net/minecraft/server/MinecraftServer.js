// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.origName === '<init>' && methodInfo.argSigs.length > 6) {
    info.class[methodInfo.argSigs[2].slice(1, -1)].name = 'com.mojang.datafixers.DataFixer'
    info.class[methodInfo.argSigs[6].slice(1, -1)].name = CLASS.PLAYER_PROFILE_CACHE
  }
  for (const c of code.consts) {
    if (typeof c === 'string') {
      if (c.startsWith('Saving chunks for level')) return 'saveAllWorlds'
      else if (c === 'Stopping server') return 'stopServer'
      else if (c === 'Server thread') return 'startServerThread'
      else if (c === 'sendCommandFeedback') return 'sendCommandFeedback'
      else if (c === 'save' || c === 'tallying') return 'tick'
      else if (c === 'spawnRadius') {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.SERVER_WORLD
        return 'getSpawnRadius'
      } else if (c === 'server-icon.png') {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.SERVER_STATUS_RESPONSE
        return 'addIconToResponse'
      } else if (c === 'Profiler Position') {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.CRASH_REPORT
        return 'addServerInfoToCrashReport'
      }
    } else if (c === 29999984) return 'getMaxWorldSize'
  }
  for (const line of code.lines) {
    if (typeof line.const !== 'string') continue
    if (line.const === 'doDaylightCycle') {
      info.class[line.next.call.fullClassName].name = CLASS.GAME_RULES
      info.method[line.next.call.fullSig].name = 'getBoolean'
      info.method[line.previous.call.fullSig].name = 'getGameRules'
    } else if (line.const === 'whitelist_enabled') {
      const addStat = line.next.next.next.call
      info.class[addStat.fullClassName].name = 'net.minecraft.profiler.Snooper'
      info.method[addStat.fullSig].name = 'addStat'
      return 'addStatsToSnooper'
    } else if (line.const.startsWith('menu.') && line.next.call) {
      info.method[line.next.call.fullSig].name = 'setUserMessage'
      switch (line.const) {
        case 'menu.convertingLevel': return 'convertMapIfNeeded'
        case 'menu.generatingTerrain': return 'initialWorldChunkLoad'
        case 'menu.loadingLevel': return 'loadWorlds'
      }
    }
  }
  // if (code.consts.length) console.log(code.consts)
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/io/File;':
      return fieldInfo.static ? 'USERCACHE_FILE' : 'anvilFile'
    case 'Lcom/mojang/authlib/yggdrasil/YggdrasilAuthenticationService;': return 'authService'
    case 'Lcom/mojang/authlib/minecraft/MinecraftSessionService;': return 'sessionService'
    case 'Lcom/mojang/authlib/GameProfileRepository;': return 'profileRepo'
    case 'Lcom/mojang/datafixers/DataFix;': return 'dataFix'
    case 'Ljava/net/Proxy;': return 'proxy'
    case 'Ljava/util/Random;': return 'random'
    case 'Ljava/lang/Thread;': return 'serverThread'
    case '[J': return 'tickTimeArray'
    case '[[J': return 'timeOfLastDimensionTick'
  }
  if (s`${CLASS.SNOOPER}`.matches(fieldInfo)) return 'snooper'
  if (s`${CLASS.PLAYER_PROFILE_CACHE}`.matches(fieldInfo)) return 'playerProfileCache'
  if (s`${CLASS.SERVER_STATUS_RESPONSE}`.matches(fieldInfo)) return 'serverStatus'
  if (s`[${CLASS.SERVER_WORLD}`.matches(fieldInfo)) return 'worlds'
}
