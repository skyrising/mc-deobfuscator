import * as CLASS from '../../../../ClassNames'
// TODO: use ClassNames.js

export function method (cls, method, code, methodInfo, clsInfo, info) {
  /*
  switch (method.getReturnType().getSignature()) {
    case 'Lcom/mojang/authlib/yggdrasil/YggdrasilAuthenticationService;': return 'getAuthService'
    case 'Lcom/mojang/authlib/minecraft/MinecraftSessionService;': return 'getSessionService'
    case 'Lcom/mojang/authlib/GameProfileRepository;': return 'getProfileRepo'
    case 'Ljava/net/Proxy;': return 'getProxy'
  } */
  if (method.origName === '<init>' && methodInfo.args.length > 6) {
    info.class[methodInfo.args[2].getClassName()].name = 'com.mojang.datafixers.DataFixer'
    info.class[methodInfo.args[6].getClassName()].name = 'net.minecraft.server.management.PlayerProfileCache'
  }
  for (const c of code.consts) {
    if (typeof c === 'string') {
      if (c.startsWith('Saving chunks for level')) return 'saveAllWorlds'
      else if (c === 'Stopping server') return 'stopServer'
      else if (c === 'Server thread') return 'startServerThread'
      else if (c === 'sendCommandFeedback') return 'sendCommandFeedback'
      else if (c === 'save' || c === 'tallying') return 'tick'
      else if (c === 'spawnRadius') {
        info.class[methodInfo.args[0].getClassName()].name = CLASS.SERVER_WORLD
        return 'getSpawnRadius'
      } else if (c === 'server-icon.png') {
        info.class[methodInfo.args[0].getClassName()].name = 'net.minecraft.network.ServerStatusResponse'
        return 'addIconToResponse'
      } else if (c === 'Profiler Position') {
        info.class[methodInfo.args[0].getClassName()].name = 'net.minecraft.crash.CrashReport'
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

export function field (fieldInfo) {
  const {sig, clsInfo, info} = fieldInfo
  const Snooper = info.classReverse['net.minecraft.profiler.Snooper']
  const PlayerProfileCache = info.classReverse['net.minecraft.server.management.PlayerProfileCache']
  const ServerStatusResponse = info.classReverse[CLASS.SERVER_STATUS_RESPONSE]
  const WorldServer = info.classReverse[CLASS.SERVER_WORLD]
  if (!PlayerProfileCache || !ServerStatusResponse || !WorldServer || !Snooper) clsInfo.done = false
  if (Snooper && sig === 'L' + Snooper + ';') return 'snooper'
  if (PlayerProfileCache && sig === 'L' + PlayerProfileCache + ';') return 'playerProfileCache'
  if (ServerStatusResponse && sig === 'L' + ServerStatusResponse + ';') return 'serverStatusResponse'
  if (WorldServer && sig === '[L' + WorldServer + ';') return 'worlds'
  switch (sig) {
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
}
