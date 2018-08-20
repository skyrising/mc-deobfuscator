import * as PKG from '../PackageNames'
import * as CLASS from '../ClassNames'
import {hasSuperClass, toUpperCamelCase, decodeType} from '../util'

export const generic = true
export const name = 'generic'

const simpleConstToClass = Object.freeze({
  'box[': CLASS.AABB,
  'Using ARB_multitexture.\n': CLASS.OPENGL_HELPER,
  '{} was kicked for floating too long!': CLASS.NET_PLAYER_HANDLER,
  'MpServer': CLASS.WORLD_CLIENT,
  'unlimitedTracking': CLASS.MAP_DATA,
  'Error starting SoundSystem. Turning off sounds & music': CLASS.SOUND_SYSTEM,
  'selectWorld.load_folder_access': CLASS.ANVIL_SAVE_CONVERTER,
  'Invalid font->characters: expected object, was ': CLASS.FONT_METADATA_SECTION_SERIALIZER,
  'Villages': CLASS.VILLAGE_COLLECTION,
  'Golems': CLASS.VILLAGE,
  'Unable to resolve BlockEntity for ItemInstance: {}': CLASS.DATAFIX_BLOCK_ENTITY_TAG,
  'shaders/post/creeper.json': CLASS.ENTITY_RENDERER,
  'Map colour ID must be between 0 and 63 (inclusive)': CLASS.MAP_COLOR,
  'Detected infinite loop in loot tables': CLASS.LOOT_TABLE,
  'Unknown loot entry type \'': CLASS.LOOT_ENTRY,
  'default_1_1': CLASS.WORLD_TYPE,
  'Duplicate packet id:': CLASS.PACKET,
  'ByteArray with size ': CLASS.PACKET_BUFFER,
  'Not tesselating!': CLASS.TESSELATOR,
  'Already tesselating!': CLASS.TESSELATOR,
  '/environment/clouds.png': CLASS.RENDER_GLOBAL,
  'minecraft:blocks/destroy_stage_': CLASS.RENDER_GLOBAL,
  'Rendering item': CLASS.RENDER_ITEM,
  'Unable to load variant: {} from {}': CLASS.BLOCK_MODEL_BAKERY,
  'livingEntityBaseTick': CLASS.ENTITY_LIVING_BASE,
  'HurtTime': CLASS.ENTITY_LIVING_BASE,
  'DeathLootTableSeed': CLASS.ENTITY_LIVING,
  'playerGameType': CLASS.ENTITY_PLAYER,
  'ChestedHorse': CLASS.ENTITY_CHESTED_HORSE,
  'HorseChest': CLASS.ENTITY_ABSTRACT_HORSE,
  'ownerName': CLASS.ENTITY_THROWABLE,
  'CustomDisplayTile': CLASS.ENTITY_MINECART,
  'PushX': CLASS.ENTITY_MINECART_FURNACE,
  'TNTFuse': CLASS.ENTITY_MINECART_TNT,
  'ForcedAge': CLASS.ENTITY_AGING,
  'Fleeing speed bonus': CLASS.ENTITY_CREATURE,
  'Sitting': CLASS.ENTITY_TAMEABLE,
  'InLove': CLASS.ENTITY_BREEDABLE,
  'OMPenthouse': CLASS.OCEAN_MONUMENT_PIECES,
  'An Objective with the name \'': CLASS.SCOREBOARD,
  'X90_Y180': CLASS.MODEL_ROTATION,
  'Resource download thread': CLASS.RESOURCE_DOWNLOAD_THREAD,
  'textures/gui/options_background.png': CLASS.GUI,
  'Invalid Item!': CLASS.GUI_SCREEN,
  'selectWorld.edit.title': CLASS.GUI_EDIT_WORLD,
  'options.customizeTitle': CLASS.GUI_CUSTOMIZE_WORLD,
  'createWorld.customize.flat.title': CLASS.GUI_CUSTOMIZE_FLAT,
  'multiplayer.title': CLASS.GUI_MULTIPLAYER,
  'options.title': CLASS.GUI_OPTIONS,
  'options.skinCustomisation.title': CLASS.GUI_OPTIONS_SKIN,
  'controls.resetAll': CLASS.GUI_OPTIONS_CONTROLS,
  'options.languageWarning': CLASS.GUI_OPTIONS_LANGUAGE,
  'options.snooper.title': CLASS.GUI_OPTIONS_SNOOPER,
  'resourcePack.openFolder': CLASS.GUI_OPTIONS_RESOURCE_PACKS,
  'texturePack.openFolder': CLASS.GUI_OPTIONS_TEXTURE_PACKS,
  'options.sounds.title': CLASS.GUI_OPTIONS_SOUNDS,
  'Invalid Biome id': CLASS.BIOME_PROVIDER,
  'Unable to serialize an anonymous value to json!': CLASS.DATA_GENERATOR,
  'BiomeBuilder{\nsurfaceBuilder=': CLASS.BIOME$BIOME_BUILDER,
  'Something went wrong when converting from HSV to RGB. Input was ': CLASS.MATH_HELPER,
  'blockDiamond': CLASS.BLOCK,
  'Smelting Recipe ': CLASS.SMELTING_RECIPE,
  'Tried to load invalid item: {}': CLASS.ITEM_STACK,
  'An ingredient entry is either a tag or an item, not both': CLASS.INGREDIENT,
  'Item List': CLASS.DATA_PROVIDER_ITEMS,
  'Block List': CLASS.DATA_PROVIDER_BLOCKS,
  'Advancements': CLASS.DATA_PROVIDER_ADVANCEMENTS,
  'data/minecraft/advancements/recipes/root.json': CLASS.DATA_PROVIDER_RECIPES,
  'Command Syntax': CLASS.DATA_PROVIDER_COMMANDS,
  'SNBT -> NBT': CLASS.DATA_PROVIDER_SNBT_TO_NBT,
  'NBT -> SNBT': CLASS.DATA_PROVIDER_NBT_TO_SNBT,
  'Fluid Tags': CLASS.DATA_PROVIDER_FLUID_TAGS,
  'Block Tags': CLASS.DATA_PROVIDER_BLOCK_TAGS,
  'Item Tags': CLASS.DATA_PROVIDER_ITEM_TAGS,
  '---- Minecraft Crash Report ----\n': CLASS.CRASH_REPORT,
  'argument.player.unknown': CLASS.ARGUMENT_PLAYER,
  'argument.entity.selector.not_allowed': {
    predicate: ({code}) => code.consts.includes('@e'),
    name: CLASS.ARGUMENT_ENTITY
  },
  'argument.pos.outofworld': CLASS.ARGUMENT_BLOCKPOS,
  'argument.pos.incomplete': CLASS.ARGUMENT_VEC3,
  'argument.vec2.incomplete': CLASS.ARGUMENT_VEC2,
  'foo{bar=baz}': CLASS.ARGUMENT_BLOCK_STATE,
  '#stone[foo=bar]{baz=nbt}': CLASS.ARGUMENT_BLOCK_PREDICATE,
  'stick{foo=bar}': CLASS.ARGUMENT_ITEM_STACK,
  '#stick{foo=bar}': CLASS.ARGUMENT_ITEM_PREDICATE,
  'argument.color.invalid': CLASS.ARGUMENT_TEXT_COLOR,
  'argument.component.invalid': CLASS.ARGUMENT_TEXT_COMPONENT,
  'Hello @p :)': CLASS.ARGUMENT_MESSAGE,
  'argument.nbt.invalid': CLASS.ARGUMENT_NBT,
  'arguments.nbtpath.child.invalid': CLASS.ARGUMENT_NBT_PATH,
  'arguments.objective.notFound': CLASS.ARGUMENT_OBJECTIVE,
  'argument.criteria.invalid': CLASS.ARGUMENT_OBJECTIVE_CRITERIA,
  'arguments.operation.invalid': CLASS.ARGUMENT_OPERATION,
  'particle.notFound': CLASS.ARGUMENT_PARTICLE,
  'argument.rotation.incomplete': CLASS.ARGUMENT_ROTATION,
  'argument.scoreboardDisplaySlot.invalid': CLASS.ARGUMENT_SCOREBOARD_SLOT,
  'argument.scoreHolder.empty': CLASS.ARGUMENT_SCORE_HOLDER,
  'arguments.swizzle.invalid': CLASS.ARGUMENT_SWIZZLE,
  'team.notFound': CLASS.ARGUMENT_TEAM,
  'container.5': CLASS.ARGUMENT_ITEM_SLOT,
  'argument.id.unknown': CLASS.ARGUMENT_IDENTIFIER,
  'effect.effectNotFound': CLASS.ARGUMENT_MOB_EFFECT,
  'arguments.function.unknown': CLASS.ARGUMENT_FUNCTION,
  'argument.anchor.invalid': CLASS.ARGUMENT_ENTITY_ANCHOR,
  'enchantment.unknown': CLASS.ARGUMENT_ENCHANTMENT,
  'entity.notFound': CLASS.ARGUMENT_ENTITY_SUMMON,
  'Could not serialize argument {} ({})!': CLASS.COMMAND_ARGUMENTS,
  'Accessed MobEffects before Bootstrap!': CLASS.MOB_EFFECTS,
  'Accessed particles before Bootstrap!': CLASS.PARTICLES,
  'SimpleAdvancement{id=': CLASS.ADVANCEMENT,
  'Query Listener': CLASS.QUERY_LISTENER,
  'brewed_potion': CLASS.ADVANCEMENT_TRIGGER_BREWED_POTION,
  'changed_dimension': CLASS.ADVANCEMENT_TRIGGER_CHANGED_DIMENSION,
  'channeled_lightning': CLASS.ADVANCEMENT_TRIGGER_CHANNELED_LIGHTNING,
  'construct_beacon': CLASS.ADVANCEMENT_TRIGGER_CONSTRUCT_BEACON,
  'consume_item': CLASS.ADVANCEMENT_TRIGGER_CONSUME_ITEM,
  'cured_zombie_villager': CLASS.ADVANCEMENT_TRIGGER_CURED_ZOMBIE_VILLAGER,
  'effects_changed': CLASS.ADVANCEMENT_TRIGGER_EFFECTS_CHANGED,
  'enter_block': CLASS.ADVANCEMENT_TRIGGER_ENTER_BLOCK,
  'entity_hurt_player': CLASS.ADVANCEMENT_TRIGGER_ENTITY_HURT_PLAYER,
  'filled_bucket': CLASS.ADVANCEMENT_TRIGGER_FILLED_BUCKET,
  'fishing_rod_hooked': CLASS.ADVANCEMENT_TRIGGER_FISHING_ROD_HOOKED,
  'inventory_changed': CLASS.ADVANCEMENT_TRIGGER_INVENTORY_CHANGED,
  'item_durability_changed': CLASS.ADVANCEMENT_TRIGGER_ITEM_DURABILITY_CHANGED,
  'nether_travel': CLASS.ADVANCEMENT_TRIGGER_NETHER_TRAVEL,
  'placed_block': CLASS.ADVANCEMENT_TRIGGER_PLACED_BLOCK,
  'player_hurt_entity': CLASS.ADVANCEMENT_TRIGGER_PLAYER_HURT_ENTITY,
  'recipe_unlocked': CLASS.ADVANCEMENT_TRIGGER_RECIPE_UNLOCKED,
  'summoned_entity': CLASS.ADVANCEMENT_TRIGGER_SUMMONED_ENTITY,
  'tame_animal': CLASS.ADVANCEMENT_TRIGGER_TAME_ANIMAL,
  'used_ender_eye': CLASS.ADVANCEMENT_TRIGGER_USED_ENDER_EYE,
  'villager_trade': CLASS.ADVANCEMENT_TRIGGER_VILLAGER_TRADE,
  'Duplicate criterion id ': CLASS.ADVANCEMENT_CRITERIA,
  'AbstractCriterionInstance{criterion=': CLASS.ADVANCEMENT_ABSTRACT_CRITERION_INSTANCE,
  'interact_with_brewingstand': CLASS.STATISTICS,
  'RequiredPlayerRange': CLASS.SPAWNER_LOGIC,
  '10387319': CLASS.STRUCTURE_WOODLAND_MANSION,
  'Skipping Structure with id {}': CLASS.STRUCTURES,
  'World optimizaton finished after {} ms': CLASS.WORLD_OPTIMIZER,
  'optimizeWorld.info.converted': CLASS.GUI_SCREEN_OPTIMIZE_WORLD,
  'ThreadedAnvilChunkStorage ({}): All chunks are saved': CLASS.THREADED_ANVIL_CHUNK_STORAGE,
  'lang/%s.lang': CLASS.I18N_LOCALE,
  'lang/%s.json': CLASS.I18N_LOCALE,
  "{Name:'minecraft:air'}": CLASS.THE_FLATTENING_BLOCK_STATES,
  'pickaxeDiamond': CLASS.ITEM,
  '6364136223846793005': CLASS.GEN_LAYER,
  '-559038737': CLASS.CHUNK_POS,
  'RCON Client': CLASS.RCON_CLIENT,
  'Plains': CLASS.BIOME,
  'STRIKETHROUGH': CLASS.TEXT_FORMATTING,
  'mobBaseTick': CLASS.ENTITY_MOB,
  'X-Minecraft-Username': {
    name: CLASS.RESOURCE_PACK_REPOSITORY,
    method: 'getDownloadHeaders'
  },
  'Coordinates of biome request': {
    name: CLASS.WORLD,
    method: 'getBiome',
    args: [CLASS.BLOCK_POS],
    return: CLASS.BIOME
  },
  ' is already a registered built-in loot table': {
    name: CLASS.LOOT_TABLES,
    method: 'registerLootTable'
  },
  ' is already known to ID ': {
    name: CLASS.CONNECTION_STATE,
    method: 'registerPacket',
    args: [CLASS.PACKET_DIRECTION]
  },
  'Unknown synced attribute modifier': {
    name: CLASS.PACKET_ENTITY_PROPERTIES,
    method: 'read'
  },
  'Root tag must be a named compound tag': {
    name: CLASS.NBT_COMPRESSED,
    method: 'readRootCompound',
    return: CLASS.NBT_COMPOUND
  },
  'http://skins.minecraft.net/MinecraftSkins/%s.png': {
    name: CLASS.ABSTRACT_CLIENT_PLAYER,
    method: 'downloadSkin',
    return: CLASS.THREAD_IMAGE_DOWNLOAD
  },
  'Missing default of DefaultedMappedRegistry: ': {
    name: CLASS.DEFAULT_MAPPED_REGISTRY,
    method: 'validateKey'
  },
  'Invalid Block requested: ': {
    name: CLASS.BLOCKS,
    method: 'getRegisteredBlock',
    return: CLASS.BLOCK
  },
  'Invalid Item requested: ': {
    name: CLASS.ITEMS,
    method: 'getRegisteredItem',
    return: CLASS.ITEM
  },
  'Invalid Enchantment requested: ': {
    name: CLASS.ENCHANTMENTS,
    method: 'getRegisteredEnchantment',
    return: CLASS.ENCHANTMENT
  },
  'Invalid Biome requested: ': {
    name: CLASS.BIOMES,
    method: 'getRegisteredBiome',
    return: CLASS.BIOME
  },
  'Invalid Potion requested: ': {
    name: CLASS.POTIONS,
    method: 'getRegisteredPotion',
    return: CLASS.POTION
  },
  'Invalid MobEffect requested: ': {
    name: CLASS.MOB_EFFECTS,
    method: 'getRegisteredMobEffect',
    return: CLASS.MOB_EFFECT
  },
  'Invalid Sound requested: ': {
    name: CLASS.SOUNDS,
    method: 'getRegisteredSound',
    return: CLASS.SOUND
  },
  'Invalid Fluid requested: ': {
    name: CLASS.FLUIDS,
    method: 'getRegisteredFluid',
    return: CLASS.FLUID
  },
  'Getting Biome': {
    name: CLASS.WORLD,
    method: 'getBiome',
    return: CLASS.BIOME
  },
  'screenshots': {
    name: CLASS.SCREENSHOT_HELPER,
    method: 'saveScreenshot'
  },
  'OW KNOWS!': {
    name: CLASS.PATH_HEAP,
    method: 'addPoint',
    return: CLASS.PATH_POINT
  },
  'That name is already taken.': {
    name: CLASS.INTEGRATED_PLAYER_LIST,
    method: 'getConnectMessage',
    superClass: CLASS.PLAYER_LIST
  },
  'Merry X-mas!': {
    name: CLASS.GUI_MAIN_MENU,
    method: 'initGui',
    superClass: CLASS.GUI_SCREEN,
    baseClass: CLASS.GUI
  },
  'texts/splashes.txt': {
    name: CLASS.GUI_MAIN_MENU,
    method: 'initGui',
    superClass: CLASS.GUI_SCREEN,
    baseClass: CLASS.GUI
  },
  'Notch': {
    name: CLASS.ENTITY_PLAYER_BASE,
    baseClass: CLASS.ENTITY
  },
  'PooledMutableBlockPosition modified after it was released.': {
    name: CLASS.BLOCK_POS$POOLED_MUTABLE_BLOCK_POS,
    superClass: CLASS.BLOCK_POS$MUTABLE_BLOCK_POS
  },
  '/art/kz.png': {
    name: CLASS.RENDER_PAINTING,
    superClass: CLASS.RENDER_ENTITY
  },
  '/item/arrows.png': {
    name: CLASS.RENDER_PAINTING,
    superClass: CLASS.RENDER_ARROW
  },
  '/item/boat.png': {
    name: CLASS.RENDER_PAINTING,
    superClass: CLASS.RENDER_BOAT
  },
  'RENDER_DISTANCE': [{
    predicate: ({clsInfo}) => clsInfo.isInnerClass,
    name: 'Option'
  }, {
    name: CLASS.GAME_SETTINGS_OPTION
  }],
  'Facing': {
    predicate: ({cls}) => cls.isAbstract(),
    name: CLASS.ENTITY_HANGING
  },
  'SpellTicks': {
    predicate: ({cls}) => cls.isAbstract(),
    name: CLASS.ENTITY_SPELLCASTING_ILLAGER
  },
  'pickup': {
    predicate: ({cls}) => cls.isAbstract(),
    name: CLASS.ENTITY_ABSTRACT_ARROW
  }, /*
  'life': {
    predicate: ({cls}) => cls.isAbstract(),
    name: CLASS.ENTITY_ABSTRACT_PROJECTILE
  }, */
  '=': {
    predicate: ({clsInfo, methodInfo}) => clsInfo.isInnerClass && methodInfo.origName === 'toString',
    outerClass: CLASS.INT_HASH_MAP,
    name: 'Entry'
  },
  'options.chat.title': {
    predicate: ({code}) => !code.consts.includes('options.video'),
    name: CLASS.GUI_CHAT_OPTIONS
  },
  'deadmau5': [{
    predicate: ({sig}) => sig.endsWith('Ljava/lang/String;DDDI)V'),
    name: CLASS.RENDER_ENTITY
  }, {
    predicate: ({sig}) => sig.endsWith('FFFFFFF)V'),
    name: 'net.minecraft.client.renderer.entity.layer.LayerDeadmau5Head',
    metod: 'renderLayer',
    superClass: 'net.minecraft.entity.layer.RenderLayer'
  }],
  'Batch already started.': {
    name: CLASS.BATCH_PROCESSOR,
    method: 'startBatch'
  },
  'Server console handler': {
    name: CLASS.DEDICATED_SERVER,
    method: 'startServer'
  },
  'RCON Listener': {
    name: CLASS.RCON_LISTENER,
    args: [CLASS.RCON_SERVER],
    superClass: CLASS.RCON_THREAD
  },
  'source_entity': [{
    predicate: ({code}) => code.consts.includes('is_fire'),
    name: CLASS.ADVANCEMENT_TRIGGER_DAMAGE_SOURCE
  }, {
    name: CLASS.ADVANCEMENT_TRIGGER_DAMAGE
  }],
  'enchanted_item': {
    predicate: ({methodInfo}) => methodInfo.origName === '<clinit>',
    name: CLASS.ADVANCEMENT_TRIGGER_ENCHANTED_ITEM
  },
  'impossible': {
    predicate: ({methodInfo}) => methodInfo.origName === '<clinit>',
    name: CLASS.ADVANCEMENT_TRIGGER_IMPOSSIBLE
  },
  'killing_blow': [{
    predicate: ({clsInfo}) => clsInfo.isInnerClass,
    name: 'Instance'
  }, {
    name: CLASS.ADVANCEMENT_TRIGGER_KILL
  }],
  'levitation': {
    predicate: ({line}) => line.next.op === 'invokespecial',
    name: CLASS.ADVANCEMENT_TRIGGER_LEVITATION
  },
  'tick': [{
    predicate: ({methodInfo, code}) => methodInfo.origName === '<clinit>' && code.consts.includes('functions/'),
    name: CLASS.FUNCTION_MANAGER
  }, {
    predicate: ({methodInfo}) => methodInfo.origName === '<clinit>',
    name: CLASS.ADVANCEMENT_TRIGGER_TICK
  }],
  'used_totem': {
    predicate: ({methodInfo}) => methodInfo.origName === '<clinit>',
    name: CLASS.ADVANCEMENT_TRIGGER_USED_TOTEM
  },
  'Enchant': {
    name: CLASS.CONTAINER_ENCHANTMENT,
    superClass: CLASS.CONTAINER
  },
  'entityBaseTick': {
    name: CLASS.ENTITY,
    method: 'tick',
    call: {
      class: CLASS.PROFILER,
      method: 'start'
    }
  },
  'falling_block': {
    name: CLASS.ENTITIES,
    method: 'init',
    call: {
      next: 'invokestatic',
      method: 'registerEntity'
    }
  },
  'Banned by an operator.': {
    name: CLASS.BAN_DETAIL,
    field: 'reason'
  },
  'selectWorld.title': {
    name: CLASS.GUI_SELECT_WORLD,
    call: {
      next: 'invokestatic',
      class: CLASS.I18N,
      method: 'format'
    },
    field: 'title'
  },
  'old! {}': {
    predicate: ({cls}) => cls.getSuperclassName() !== 'java/lang/Enum',
    name: CLASS.GEN_LAYER_HILLS,
    method: 'getInts',
    superClass: CLASS.GEN_LAYER
  },
  'PigZombie': {
    predicate: ({line}) => /^[a-z]{1,3}$/.test(line.previous.const),
    name: CLASS.ENTITIES
  },
  'Bad packet id': {
    predicate: ({sig}) => sig.startsWith('(Ljava/io/DataInputStream;)L'),
    name: 'net.minecraft.network.Packet',
    method: 'decode'
  },
  'c.': {
    predicate: ({code}) => code.consts.includes(36) && code.consts.includes('.dat'),
    name: CLASS.ALPHA_CHUNK_LOADER,
    method: 'getFileForChunk'
  },
  'clazz': {
    name: CLASS.BLOCK_PROPERTY_BASE,
    interfaces: [CLASS.BLOCK_PROPERTY]
  },
  'waterlogged': {
    predicate: ({code}) => code.consts.includes('hinge'),
    name: CLASS.BLOCK_PROPERTIES
  },
  'true': {
    predicate: ({code, sig}) => sig === '(Ljava/lang/String;)Ljava/util/Optional;' && code.consts.includes('false'),
    name: CLASS.BLOCK_PROPERTY_BOOL,
    method: 'parseValue'
  },
  'Integrated Server (map_client.txt)': {
    interfaces: [CLASS.CRASH_REPORT_DETAIL]
  },
  'Unable to get CW facing for axis ': {
    name: CLASS.FACING,
    method: 'rotateAround',
    args: ['Axis']
  },
  'Unable to get X-rotated facing of ': {
    name: CLASS.FACING,
    method: 'rotateX'
  },
  'Unable to get Y-rotated facing of ': {
    name: CLASS.FACING,
    method: 'rotateY'
  },
  'Unable to get Z-rotated facing of ': {
    name: CLASS.FACING,
    method: 'rotateZ'
  },
  'Unable to get CCW facing of ': {
    name: CLASS.FACING,
    method: 'rotateYCCW'
  },
  'Cannot get property ': {
    name: CLASS.BLOCK_PROPERTY_CONTAINER,
    method: 'getProperty',
    args: [CLASS.BLOCK_PROPERTY]
  },
  'Cannot set property ': {
    name: CLASS.BLOCK_PROPERTY_CONTAINER,
    method: 'setProperty'
  },
  'VoxelShape[': CLASS.VOXEL_SHAPE,
  'Exception while updating neighbours': {
    name: CLASS.WORLD,
    method: 'updateNeighbour',
    call: {
      class: CLASS.CRASH_REPORT,
      method: 'create'
    }
  },
  'progress': {
    predicate: ({code}) => code.consts.includes('extending') && code.consts.includes('source'),
    name: CLASS.BLOCK_ENTITY_PISTON_MOVED_BLOCK
  },
  'checkLight': {
    name: CLASS.WORLD,
    method: 'setBlockState',
    args: [CLASS.BLOCK_POS, CLASS.BLOCK_STATE],
    eval ({line, info}) {
      const profilerStart = line.nextOp('invokevirtual')
      if (!profilerStart) return
      const checkLight = profilerStart.nextOp('invokevirtual')
      if (checkLight && checkLight.call) info.method[checkLight.call.fullSig].name = 'checkLight'
    }
  },
  'ServerChunkCache: ': {
    name: CLASS.CHUNK_PROVIDER_SERVER,
    interfaces: [CLASS.CHUNK_PROVIDER]
  },
  'bred_animals': {
    name: CLASS.ADVANCEMENT_TRIGGER_BRED_ANIMALS,
    interfaces: [CLASS.ADVANCEMENT_TRIGGER]
  },
  'Connecting to {}, {}': CLASS.GUI_MULTIPLAYER_CONNECTING,
  'lanServer.start': CLASS.GUI_OPEN_TO_LAN,
  'gui.recipebook.moreRecipes': CLASS.GUI_RECIPE_BOOK,
  'textures/gui/container/brewing_stand.png': CLASS.GUI_BREWING_STAND,
  'textures/gui/bars.png': CLASS.GUI_BOSS_BAR,
  '>': {
    predicate: ({code}) => !code.consts.includes('+=') && code.consts.includes('<'),
    name: CLASS.GUI_SUBTITLE
  },
  'chat.link.confirmTrusted': CLASS.GUI_CHAT_LINK_CONFIRM,
  'createWorld.customize.presets.title': CLASS.GUI_SUPERFLAT_PRESETS,
  'multiplayer.downloadingTerrain': CLASS.GUI_DOWNLOADING_TERRAIN,
  'options.videoTitle': CLASS.GUI_OPTIONS_VIDEO,
  'texts/end.txt': CLASS.GUI_END_SCROLL,
  'textures/gui/container/inventory.png': CLASS.GUI_INVENTORY,
  'textures/gui/container/crafting_table.png': CLASS.GUI_CRAFTING_TABLE,
  'textures/gui/container/creative_inventory/tabs.png': CLASS.GUI_CREATIVE_INVENTORY,
  'textures/gui/container/dispenser.png': CLASS.GUI_DISPENSER,
  'textures/gui/container/enchanting_table.png': CLASS.GUI_ENCHANTING_TABLE,
  'textures/gui/container/furnace.png': CLASS.GUI_FURNACE,
  'Unexpected key packet': CLASS.SERVER_HANDLER_LOGIN,
  'Failed to add player. {} already is in chunk {}, {}': {
    name: CLASS.PLAYER_CHUNK_MAP_ENTRY,
    method: 'addPlayer',
    args: [CLASS.SERVER_PLAYER]
  }
})

function handleSimple (obj, params) {
  const {cls, line, method, methodInfo, clsInfo, info} = params
  if (!obj) return
  if (typeof obj === 'string') return obj
  if (Array.isArray(obj)) {
    for (const el of obj) {
      const res = handleSimple(el, params)
      if (res) return res
    }
  }
  if (obj.predicate && !obj.predicate(params)) return
  if (obj.return) info.class[method.getReturnType().getClassName()].name = obj.return
  if (obj.args) {
    obj.args.forEach((name, i) => {
      info.class[methodInfo.args[i].getClassName()].name = name
    })
  }
  if (obj.method) methodInfo.name = obj.method
  if (obj.superClass) info.class[cls.getSuperclassName()].name = obj.superClass
  if (obj.baseClass) {
    const scs = cls.getSuperClasses()
    if (scs.length >= 2) info.class[scs[scs.length - 2].getClassName()].name = obj.baseClass
    else console.log((obj.name || clsInfo.obfName) + ' does not have enough superclasses')
  }
  if (obj.outerClass) info.class[clsInfo.outerClassName].name = obj.outerClass
  if (obj.call) {
    let call
    if (obj.call.next) call = (line.nextOp(obj.call.next) || {}).call
    else call = (line.next || {}).call
    if (call) {
      if (obj.call.method) info.method[call.fullSig].name = obj.call.method
      if (obj.call.class) info.class[call.className].name = obj.call.class
    }
  }
  if (obj.field) {
    const putfield = line.nextOp('putfield')
    if (putfield) clsInfo.field[putfield.field.fieldName] = obj.field
  }
  if (obj.interfaces) {
    const ifn = clsInfo.interfaceNames
    if (obj.interfaces.length === ifn.length) {
      for (let i = 0; i < obj.interfaces.length; i++) {
        if (obj.interfaces[i]) info.class[ifn[i]].name = obj.interfaces[i]
      }
    } else {
      console.log('Number of interfaces for ' + (obj.name || clsInfo.obfName) + ' mismatch: expected ' + obj.interfaces.length + ' got ' + ifn.length)
    }
  }
  if (obj.eval) obj.eval(params)
  return obj.name
}

function getClassNameForConstant (c, line, cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const simple = handleSimple(simpleConstToClass[c], {line, cls, method, sig, code, methodInfo, clsInfo, info})
  if (simple) return simple
  const Entity = info.classReverse[CLASS.ENTITY]
  switch (c) {
    // case 'RecordItem': return !clsInfo.isInnerClass && CLASS.BLOCK_JUKEBOX
    case 'key.forward':
      info.class[line.prevOp('new').className].name = CLASS.KEY_BINDING
      return CLASS.GAME_SETTINGS
    case 'TransferCooldown': {
      if (Entity && hasSuperClass(cls, Entity)) return CLASS.ENTITY_MINECART_HOPPER
      const ifn = clsInfo.interfaceNames
      if (ifn.length === 2) {
        info.class[ifn[0]].name = CLASS.HOPPER_BASE
        info.class[ifn[1]].name = CLASS.TICKABLE
        info.class[cls.getSuperclassName()].name = CLASS.LOCKABLE_LOOT_CONTAINER
        return CLASS.BLOCK_ENTITY_HOPPER
      }
      return CLASS.ENTITY_MINECART_HOPPER
    }
    /*
    case 'CustomDisplayTile': return 'net.minecraft.entity.item.EntityMinecart'
    case 'PushX': return 'net.minecraft.entity.item.EntityMinecartFurnace'
    case 'NoBasePlate': return 'net.minecraft.entity.item.EntityArmorStand'
    case 'PickupDelay': return 'net.minecraft.entity.item.EntityItem'
    case 'ItemDropChance': return 'net.minecraft.entity.item.EntityItemFrame'
    case 'Motive': return 'net.minecraft.entity.item.EntityPainting'
    case '/mob/ghast.png': return 'net.minecraft.entity.hostile.EntityGhast'
    case '/mob/slime.png': return 'net.minecraft.entity.hostile.EntitySlime'
    case '/mob/spider.png': return 'net.minecraft.entity.hostile.EntitySpider'
    case '/mob/skeleton.png': return 'net.minecraft.entity.hostile.EntitySkeleton'
    case '/mob/creeper.png': return 'net.minecraft.entity.hostile.EntityCreeper'
    case '/mob/sheep.png': return 'net.minecraft.entity.passive.EntitySheep'
    case '/mob/pig.png': return 'net.minecraft.entity.passive.EntityPig'
    case '/mob/chicken.png': return 'net.minecraft.entity.passive.EntityChicken'
    case '/mob/cow.png': return 'net.minecraft.entity.passive.EntityCow'
    */
    case 'chunkSource': {
      methodInfo.name = 'tick'
      info.method[line.next.call.fullSig].name = 'next'
      info.class[line.next.call.className].name = CLASS.PROFILER
      info.class[cls.getSuperclassName()].name = CLASS.WORLD
      try {
        const worldInfoLine = (line.prevOp('ldc_w "mobSpawner"') || line.prevOp('ldc_w "spawner"')).nextOp('getfield')
        clsInfo.field[worldInfoLine.field.fieldName] = 'worldInfo'
        info.class[decodeType(worldInfoLine.field.type)].name = CLASS.WORLD_INFO
        const entitySpawnerLine = worldInfoLine.nextOp('getfield')
        clsInfo.field[entitySpawnerLine.field.fieldName] = 'entitySpawner'
        info.class[decodeType(entitySpawnerLine.field.type)].name = CLASS.ENTITY_SPAWNER
      } catch (e) {
        console.error(e)
      }
      return CLASS.WORLD_SERVER
    }
    case 'Accessed Items before Bootstrap!':
      if (code.lines[0].call) {
        const BootstrapIsRegistered = code.lines[0].call
        info.class[BootstrapIsRegistered.fullClassName].name = CLASS.BOOTSTRAP
        info.method[BootstrapIsRegistered.fullSig].name = 'isRegistered'
      } else console.log('Expected call to Bootstrap.isRegistered:', code.lines[0])
      return
  }
  if (/^commands\.(.*?)\.$/.test(c)) {
    const commandName = c.match(/^commands\.(.*?)\.$/)[1]
    if (commandName.indexOf('.') >= 0) return
    return PKG.COMMAND + '.Command' + toUpperCamelCase(commandName)
  }
  if (c.startsWith('Skipping BlockEntity') || c.startsWith('Skipping TileEntity')) {
    methodInfo.name = 'fromNBT'
    return CLASS.BLOCK_ENTITY
  }
  if (c.startsWith('Wrong location!')) {
    methodInfo.name = 'addEntity'
    return CLASS.CHUNK
  }
  if (c.startsWith('fossils/')) {
    info.class[cls.getSuperclassName()].name = CLASS.WORLD_GENERATOR
    return CLASS.WORLD_GEN_FOSSILS
  }
  if (c.startsWith('Starting integrated minecraft server version')) return CLASS.INTEGRATED_SERVER
  if (c.endsWith('Fix') && hasSuperClass(cls, 'com.mojang.datafixers.DataFix')) return PKG.DATAFIX + '.' + c
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  methodInfo.done = false
  const {sig} = methodInfo
  const sc = cls.getSuperclassName()
  if (sc === 'java.lang.Enum') {
    if (methodInfo.origName === '<clinit>') enumClinit(cls, method, code, methodInfo, clsInfo, info)
    else if (methodInfo.origName === 'values') {
      clsInfo.field[code.lines[0].field.fieldName] = '$VALUES'
    }
  }
  for (const line of code.lines) {
    if (line.const === undefined) continue
    const name = getClassNameForConstant(String(line.const), line, cls, method, code, methodInfo, clsInfo, info)
    if (name) clsInfo.name = name
  }
  const NBTBase = info.classReverse[CLASS.NBT_BASE]
  const Locale = info.classReverse[CLASS.I18N_LOCALE]
  if (sig === '()B' && NBTBase && hasSuperClass(cls, NBTBase)) {
    const id = code.consts[0]
    const type = ([
      'End', 'Byte', 'Short', 'Int', 'Long', 'Float', 'Double', 'ByteArray', 'String', 'List', 'Compound', 'IntArray', 'LongArray'
    ])[id]
    if (id !== undefined && type) clsInfo.name = PKG.NBT + '.NBT' + type
  }
  if (Locale && sig === '(L' + Locale + ';)V') {
    methodInfo.name = 'setLocale'
    clsInfo.name = CLASS.I18N
  }
  if (clsInfo.name) clsInfo.done = false
}

function enumClinit (cls, method, code, methodInfo, clsInfo, info) {
  const names = []
  for (let i = 0; i < code.lines.length; i++) {
    const line = code.lines[i]
    if (line.op === 'new') {
      const ldc = line.nextOp(['ldc', 'ldc_w'])
      if (!ldc) continue
      const putstatic = ldc.nextOp('putstatic')
      if (!putstatic) continue
      i = code.lines.indexOf(putstatic)
      if (!/^[A-Z_\d]+$/.test(ldc.const)) {
        console.log('Not renaming ' + clsInfo.obfName + '.' + ldc.const)
        continue
      }
      const name = ldc.const.toUpperCase()
      clsInfo.field[putstatic.field.fieldName] = name
      names.push(name)
    }
  }
  clsInfo.enumNames = names
  const clsName = getEnumName(names, cls, clsInfo, info)
  if (clsName) clsInfo.name = clsName
}

function getEnumName (names, cls, clsInfo, info) {
  switch (names.slice(0, 5).join(',')) {
    case 'PEACEFUL,EASY,NORMAL,HARD': return CLASS.DIFFICULTY
    case 'NOT_SET,SURVIVAL,CREATIVE,ADVENTURE,SPECTATOR': return CLASS.GAME_MODE
    case 'BLOCKED,OPEN,WALKABLE,TRAPDOOR,FENCE': return CLASS.PATH_NODE_TYPE
    case 'OVERWORLD,NETHER,THE_END': return CLASS.DIMENSION_TYPE
    case 'SUCCESS,PASS,FAIL': return CLASS.ACTION_RESULT
    case 'TASK,CHALLENGE,GOAL': return CLASS.ADVANCEMENT_FRAME_TYPE
    case 'BASE,SQUARE_BOTTOM_LEFT,SQUARE_BOTTOM_RIGHT,SQUARE_TOP_LEFT,SQUARE_TOP_RIGHT': return CLASS.BANNER_PATTERN
    case 'MASTER,MUSIC,RECORDS,WEATHER,BLOCKS': return CLASS.SOUND_CATEGORY
    case 'NORTH_SOUTH,EAST_WEST,ASCENDING_EAST,ASCENDING_WEST,ASCENDING_NORTH':
      return clsInfo.isInnerClass ? CLASS.BLOCK_RAIL_BASE$DIRECTION : CLASS.RAIL_DIRECTION
    case 'SOLID,BOWL,CENTER_SMALL,MIDDLE_POLE_THIN,CENTER': return CLASS.BLOCK_FACE_SHAPE
    case 'NONE,CLOCKWISE_90,CLOCKWISE_180,COUNTERCLOCKWISE_90': return CLASS.ROTATION
    case 'ABOVE,BELOW,LEFT,RIGHT': return CLASS.ADVANCEMENT_TAB_TYPE
    case 'COMMON,UNCOMMON,RARE,EPIC': return CLASS.RARITY
    case 'NONE,IRON,GOLD,DIAMOND': return CLASS.HORSE_ARMOR_TYPE
    case 'WOOD,STONE,IRON,DIAMOND,GOLD': return clsInfo.isInnerClass ? CLASS.ITEM$TOOL_MATERIAL : CLASS.TOOL_MATERIAL
    case 'MONSTER,CREATURE,AMBIENT,WATER_CREATURE': return CLASS.CREATURE_TYPE
    case 'WHITE,ORANGE,MAGENTA,LIGHT_BLUE,YELLOW': return CLASS.DYE_COLOR
    case 'HARP,BASEDRUM,SNARE,HAT,BASS': return CLASS.NOTE_BLOCK_INSTRUMENT
    case 'EMPTY,BASE,CARVED,LIQUID_CARVED,LIGHTED': // TODO: why?
    case 'EMPTY,BASE,CARVED,LIQUID_CARVED,DECORATED': return CLASS.CHUNK_STAGE
    case 'NORMAL,DESTROY,BLOCK,IGNORE,PUSH_ONLY': return CLASS.PISTON_BEHAVIOR
    case 'GROWING,SHRINKING,STATIONARY': return CLASS.BORDER_STATUS
    case 'SAVE,LOAD,CORNER,DATA': return CLASS.STRUCTURE_BLOCK_MODE
    case 'BITMAP,TTF,LEGACY_UNICODE': return CLASS.FONT_TYPE
    case 'CHAT,SYSTEM,GAME_INFO': return CLASS.CHAT_TYPE
    case 'NEVER,SOURCE_ONLY,ALWAYS': return CLASS.RAY_TRACE_FLUID_MODE
    case 'PROTOCHUNK,LEVELCHUNK': return CLASS.CHUNK_STAGE$TYPE
    case 'DEFAULT,STICKY': return CLASS.PISTON_TYPE
    case 'SKY,BLOCK': return CLASS.LIGHT_TYPE
    case 'DOWN,UP,NORTH,SOUTH,WEST':
      if (clsInfo.isInnerClass) return
      if (clsInfo.interfaceNames.length) return CLASS.FACING
      return
    case 'NONE,TAIGA,EXTREME_HILLS,JUNGLE,MESA':
      info.class[clsInfo.outerClassName].name = CLASS.BIOME
      return CLASS.BIOME$CATEGORY
    case 'NONE,RAIN,SNOW':
      info.class[clsInfo.outerClassName].name = CLASS.BIOME
      return CLASS.BIOME$PRECIPITATION
    case 'PINK,BLUE,RED,GREEN,YELLOW':
      info.class[clsInfo.outerClassName].name = CLASS.BOSS_INFO
      return CLASS.BOSS_INFO$COLOR
    case 'PROGRESS,NOTCHED_6,NOTCHED_10,NOTCHED_12,NOTCHED_20':
      info.class[clsInfo.outerClassName].name = CLASS.BOSS_INFO
      return CLASS.BOSS_INFO$OVERLAY
    case 'WORLD_SURFACE_WG,OCEAN_FLOOR_WG,LIGHT_BLOCKING,MOTION_BLOCKING,MOTION_BLOCKING_NO_LEAVES':
      info.class[clsInfo.outerClassName].name = CLASS.HEIGHTMAP
      return CLASS.HEIGHTMAP$TYPE
    case 'LINUX,SOLARIS,WINDOWS,OSX,UNKNOWN':
      info.class[clsInfo.outerClassName].name = CLASS.UTILS
      return CLASS.UTILS$OS
    case 'MISS,BLOCK,ENTITY':
      info.class[clsInfo.outerClassName].name = CLASS.HIT_RESULT
      return CLASS.HIT_RESULT$TYPE
  }
}

export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  const Profiler = info.classReverse[CLASS.PROFILER]
  if (Profiler && sig === 'L' + Profiler + ';') return 'profiler'
  if (!Profiler) clsInfo.done = false
  switch (sig) {
    case 'Lorg/apache/logging/log4j/Logger;': return 'LOGGER'
    case 'Ljava/text/SimpleDateFormat;': return 'DATE_FORMAT'
  }
}