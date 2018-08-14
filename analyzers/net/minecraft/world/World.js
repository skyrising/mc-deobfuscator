import {signatureTag as s} from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Random;': return 'rand'
    case '[I': return 'lightUpdateBlockList'
    case 'J': return 'cloudColor'
    case 'I':
      if (field.isProtected() && field.isFinal()) return 'TICK_RANDOM_ADDEND'
      break
  }
  const WorldInfo = info.classReverse[CLASS.WORLD_INFO]
  const Profiler = info.classReverse[CLASS.PROFILER]
  const VillageCollection = info.classReverse[CLASS.VILLAGE_COLLECTION]
  const ChunkProvider = info.classReverse[CLASS.CHUNK_PROVIDER]
  const Facing = info.classReverse[CLASS.FACING]
  const IntHashMap = info.classReverse[CLASS.INT_HASH_MAP]
  const SaveHandler = info.classReverse[CLASS.SAVE_HANDLER]
  if (!WorldInfo) clsInfo.done = false
  if (WorldInfo && sig === 'L' + WorldInfo + ';') return 'worldInfo'
  if (!Profiler) clsInfo.done = false
  if (Profiler && sig === 'L' + Profiler + ';') return 'profiler'
  if (!VillageCollection) clsInfo.done = false
  if (VillageCollection && sig === 'L' + VillageCollection + ';') return 'villages'
  if (!ChunkProvider) clsInfo.done = false
  if (ChunkProvider && sig === 'L' + ChunkProvider + ';') return 'chunkProvider'
  if (!Facing) clsInfo.done = false
  if (Facing && sig === '[L' + Facing + ';') return 'FACINGS'
  if (!IntHashMap) clsInfo.done = false
  if (IntHashMap && sig === 'L' + IntHashMap + ';') return 'idToEntity'
  if (!SaveHandler) clsInfo.done = false
  if (SaveHandler && sig === 'L' + SaveHandler + ';') return 'saveHandler'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (s`(${CLASS.BLOCK_POS})${CLASS.BLOCK_STATE}`.matches(methodInfo)) return 'getBlockState'
  if (s`(${CLASS.BLOCK_POS}${CLASS.BLOCK_STATE}I)Z`.matches(methodInfo)) return 'setBlockState'
  if (sig.startsWith('(L') && sig.endsWith(')Z') && code.consts.includes(0.014)) {
    return 'handleMaterialMovement'
  }
  if (s`(${CLASS.BLOCK_POS})Z`.matches(methodInfo)) {
    if (code.consts.includes(30000000)) return 'isValid'
    if (code.consts.includes(256)) return 'isOutsideBuildHeight'
  }
  if (s`(${CLASS.BLOCK_POS})${CLASS.CHUNK}`.matches(methodInfo) || s`(II)${CLASS.CHUNK}`.matches(methodInfo)) return 'getChunk'
  if (s`(${CLASS.BLOCK_POS}Z)Z`.matches(methodInfo) && code.consts.includes(2001)) return 'destroyBlock'
  if (s`()V`.matches(methodInfo)) {
    if (code.consts.includes('Ticking entity')) return 'tick'
    if (code.consts.includes('doWeatherCycle')) return 'updateWeather'
  }
  if (s`(${CLASS.ENTITY}Z)V`.matches(methodInfo) && code.consts.includes('checkChunk')) return 'updateEntity'
  if (s`()Ljava/lang/String;`.matches(methodInfo) && code.consts.includes('All: ')) return 'getLoadedEntitiesString'
  if (s`(${CLASS.LIGHT_TYPE}${CLASS.BLOCK_POS})Z` && code.consts.includes('getBrightness')) return 'checkLight'
  if (s`()${CLASS.GAME_RULES}`.matches(methodInfo)) return 'getGameRules'
  if (s`(${CLASS.HEIGHTMAP$TYPE}${CLASS.BLOCK_POS})${CLASS.BLOCK_POS}`.matches(methodInfo)) return 'getHighestBlock'
  if (code.consts.includes('Playing level event')) return 'playEvent'
  if (s`()I`.matches(methodInfo)) {
    if (code.consts.includes(128)) return 'getGenerationHeight'
    if (code.consts.includes(256)) return 'getHeight'
  }
  if (code.consts.includes('Can\'t send packets to server unless you\'re on the client.')) {
    info.class[methodInfo.args[0].getClassName()].name = CLASS.PACKET
    return 'sendPacketToServer'
  }
  switch (sig) {
    case '(IIIIIIZ)Z': return 'isAreaLoaded'
  }
  if (methodInfo.origName === '<init>' && methodInfo.args.length === 5) {
    info.class[methodInfo.args[0].getClassName()].name = CLASS.SAVE_HANDLER
    info.class[methodInfo.args[2].getClassName()].name = CLASS.WORLD_PROVIDER
  }
}
