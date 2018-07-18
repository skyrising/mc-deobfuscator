import * as PKG from '../PackageNames'
import * as CLASS from '../ClassNames'
import {hasSuperClass, doesImplement, toUpperCamelCase, decodeType, getDefaultName} from '../util'

export function cls (cls, clsInfo, info) {
  clsInfo.done = false
  const Block = info.classReverse[CLASS.BLOCK]
  const Item = info.classReverse[CLASS.ITEM]
  const Entity = info.classReverse[CLASS.ENTITY]
  const Enchantment = info.classReverse[CLASS.ENCHANTMENT]
  const Biome = info.classReverse[CLASS.BIOME]
  const Gui = info.classReverse[CLASS.GUI]
  const NBTBase = info.classReverse[CLASS.NBT_BASE]
  const RenderEntity = info.classReverse[CLASS.RENDER_ENTITY]
  const Packet = info.classReverse[CLASS.PACKET]
  const BlockEntity = info.classReverse[CLASS.BLOCK_ENTITY]
  const AbstractClientPlayer = info.classReverse[CLASS.ABSTRACT_CLIENT_PLAYER]
  const GenLayer = info.classReverse[CLASS.GEN_LAYER]
  const DataProvider = info.classReverse[CLASS.DATA_PROVIDER]
  const AdvancementTrigger = info.classReverse[CLASS.ADVANCEMENT_TRIGGER]
  if (!clsInfo.name) {
    if (Block && hasSuperClass(cls, Block)) return PKG.BLOCK + '.' + getDefaultName(clsInfo)
    if (Item && hasSuperClass(cls, Item)) return PKG.ITEM + '.' + getDefaultName(clsInfo)
    if (Entity && hasSuperClass(cls, Entity)) return PKG.ENTITY + '.' + getDefaultName(clsInfo)
    if (Enchantment && hasSuperClass(cls, Enchantment)) return PKG.ENCHANTMENT + '.' + getDefaultName(clsInfo)
    if (Biome && hasSuperClass(cls, Biome)) return PKG.BIOME + '.' + getDefaultName(clsInfo)
    if (Gui && hasSuperClass(cls, Gui)) return PKG.GUI + '.' + getDefaultName(clsInfo)
    if (NBTBase && (hasSuperClass(cls, NBTBase) || doesImplement(cls, NBTBase))) {
      if (cls.isAbstract()) return CLASS.NBT_PRIMITIVE
      return PKG.NBT + '.' + getDefaultName(clsInfo)
    }
    if (RenderEntity && hasSuperClass(cls, RenderEntity)) return PKG.RENDER_ENTITY + '.' + getDefaultName(clsInfo)
    if (Packet && hasSuperClass(cls, Packet)) return PKG.NETWORK + '.' + getDefaultName(clsInfo)
    if (Packet && doesImplement(cls, Packet)) return PKG.NETWORK + '.' + getDefaultName(clsInfo)
    if (BlockEntity && hasSuperClass(cls, BlockEntity)) return PKG.BLOCK_ENTITY + '.' + getDefaultName(clsInfo)
    if (AbstractClientPlayer && hasSuperClass(cls, AbstractClientPlayer)) return PKG.CLIENT_ENTITY + '.' + getDefaultName(clsInfo)
    if (GenLayer && hasSuperClass(cls, GenLayer)) return PKG.WORLD_GEN_LAYER + '.' + getDefaultName(clsInfo)
    if (DataProvider && doesImplement(cls, DataProvider)) return PKG.DATA + '.' + getDefaultName(clsInfo)
    if (AdvancementTrigger && doesImplement(cls, AdvancementTrigger)) return PKG.ADVANCEMENT_TRIGGERS + '.' + getDefaultName(clsInfo)
  }
  if (hasSuperClass(cls, 'com.mojang.datafixers.DataFix')) return PKG.DATAFIX + '.' + getDefaultName(clsInfo)
  if (hasSuperClass(cls, 'com.mojang.datafixers.schemas.Schema')) return PKG.DATAFIX_SCHEMAS + '.' + getDefaultName(clsInfo)
  if (clsInfo.isInnerClass) {
    if (clsInfo.outerClassName === info.classReverse[CLASS.PROFILER]) return 'Result'
  }
}

function getClassNameForConstant (c, line, cls, method, code, methodInfo, clsInfo, info) {
  const Entity = info.classReverse[CLASS.ENTITY]
  const sig = method.getSignature()
  switch (c) {
    case 'Using ARB_multitexture.\n': return CLASS.OPENGL_HELPER
    case '{} was kicked for floating too long!': return CLASS.NET_PLAYER_HANDLER
    case 'X-Minecraft-Username':
      methodInfo.name = 'getDownloadHeaders'
      return CLASS.RESOURCE_PACK_REPOSITORY
    case 'MpServer': return CLASS.WORLD_CLIENT
    case 'unlimitedTracking': return CLASS.MAP_DATA
    case 'Error starting SoundSystem. Turning off sounds & music': return CLASS.SOUND_SYSTEM
    case 'selectWorld.load_folder_access': return CLASS.ANVIL_SAVE_CONVERTER
    case 'Invalid font->characters: expected object, was ': return CLASS.FONT_METADATA_SECTION_SERIALIZER
    case 'Villages': return CLASS.VILLAGE_COLLECTION
    case 'Golems': return CLASS.VILLAGE
    case 'Unable to resolve BlockEntity for ItemInstance: {}': return CLASS.DATAFIX_BLOCK_ENTITY_TAG
    case 'shaders/post/creeper.json': return CLASS.ENTITY_RENDERER
    case 'Coordinates of biome request':
      info.class[method.getArgumentTypes()[0].getClassName()].name = CLASS.BLOCK_POS
      info.class[method.getReturnType().getClassName()].name = CLASS.BIOME
      methodInfo.name = 'getBiome'
      return CLASS.WORLD
    case 'default_1_1': return CLASS.WORLD_TYPE
    // case 'RecordItem': return !clsInfo.isInnerClass && CLASS.BLOCK_JUKEBOX
    case 'Map colour ID must be between 0 and 63 (inclusive)': return CLASS.MAP_COLOR
    case 'Detected infinite loop in loot tables': return CLASS.LOOT_TABLE
    case 'Unknown loot entry type \'': return CLASS.LOOT_ENTRY
    case ' is already a registered built-in loot table':
      methodInfo.name = 'registerLootTable'
      return CLASS.LOOT_TABLES
    case 'STRIKETHROUGH': return CLASS.TEXT_FORMATTING
    case 'key.forward':
      info.class[line.prevOp('new').className].name = CLASS.KEY_BINDING
      return CLASS.GAME_SETTINGS
    case 'RENDER_DISTANCE':
      return clsInfo.isInnerClass ? 'Option' : CLASS.GAME_SETTINGS_OPTION
    case 'Duplicate packet id:': return CLASS.PACKET
    case 'ByteArray with size ': return CLASS.PACKET_BUFFER
    case ' is already known to ID ':
      methodInfo.name = 'registerPacket'
      info.class[method.getArgumentTypes()[0].getClassName()].name = CLASS.PACKET_DIRECTION
      return CLASS.CONNECTION_STATE
    case 'Unknown synced attribute modifier':
      methodInfo.name = 'read'
      return PKG.PACKET_PLAY_SERVER + '.S2CEntityProperties'
    case 'Root tag must be a named compound tag':
      methodInfo.name = 'readRootCompound'
      info.class[method.getReturnType().getClassName()].name = CLASS.NBT_COMPOUND
      return CLASS.NBT_COMPRESSED
    case 'Not tesselating!': case 'Already tesselating!': return CLASS.TESSELATOR
    case '/environment/clouds.png':
    case 'minecraft:blocks/destroy_stage_': return CLASS.RENDER_GLOBAL
    case 'Rendering item': return CLASS.RENDER_ITEM
    case 'Unable to load variant: {} from {}': return CLASS.BLOCK_MODEL_BAKERY
    case 'entityBaseTick':
      methodInfo.name = 'tick'
      info.method[line.next.call.fullSig].name = 'start'
      info.class[line.next.call.className].name = CLASS.PROFILER
      return CLASS.ENTITY
    case 'falling_block':
      methodInfo.name = 'init'
      info.method[line.nextOp('invokestatic').call.fullSig].name = 'registerEntity'
      return CLASS.ENTITIES
    case 'mobBaseTick': return CLASS.ENTITY_MOB
    case 'HurtTime':
    case 'livingEntityBaseTick': return CLASS.ENTITY_LIVING_BASE
    case 'DeathLootTableSeed': return CLASS.ENTITY_LIVING
    case 'Notch':
      info.class[cls.getSuperClasses().slice(-2)[0].getClassName()].name = CLASS.ENTITY
      return CLASS.ENTITY_PLAYER_BASE
    case 'playerGameType': return CLASS.ENTITY_PLAYER
    case 'ChestedHorse': return CLASS.ENTITY_CHESTED_HORSE
    case 'HorseChest': return CLASS.ENTITY_ABSTRACT_HORSE
    case 'Facing': return cls.isAbstract() && CLASS.ENTITY_HANGING
    case 'SpellTicks': return cls.isAbstract() && CLASS.ENTITY_SPELLCASTING_ILLAGER
    case 'pickup': return cls.isAbstract() && CLASS.ENTITY_ABSTRACT_ARROW
    case 'life': return cls.isAbstract() && CLASS.ENTITY_ABSTRACT_PROJECTILE
    case 'ownerName': return CLASS.ENTITY_THROWABLE
    case 'CustomDisplayTile': return CLASS.ENTITY_MINECART
    case 'PushX': return CLASS.ENTITY_MINECART_FURNACE
    case 'TransferCooldown': {
      if (Entity && hasSuperClass(cls, Entity)) return CLASS.ENTITY_MINECART_HOPPER
      const ifn = cls.getInterfaces()
      if (ifn.length === 2) {
        info.class[ifn[0].getClassName()].name = CLASS.HOPPER_BASE
        info.class[ifn[1].getClassName()].name = CLASS.TICKABLE
        info.class[cls.getSuperclassName()].name = CLASS.LOCKABLE_LOOT_CONTAINER
        return CLASS.BLOCK_ENTITY_HOPPER
      }
      return CLASS.ENTITY_MINECART_HOPPER
    }
    case 'TNTFuse': return CLASS.ENTITY_MINECART_TNT
    case 'ForcedAge': return CLASS.ENTITY_AGING
    case 'Fleeing speed bonus': return CLASS.ENTITY_CREATURE
    case 'Sitting': return CLASS.ENTITY_TAMEABLE
    case 'InLove': return CLASS.ENTITY_BREEDABLE
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
    case 'OMPenthouse': return CLASS.OCEAN_MONUMENT_PIECES
    case 'An Objective with the name \'': return CLASS.SCOREBOARD
    case 'X90_Y180': return CLASS.MODEL_ROTATION
    case 'That name is already taken.': {
      info.class[cls.getSuperclassName()].name = CLASS.PLAYER_LIST
      methodInfo.name = 'getConnectMessage'
      return CLASS.INTEGRATED_PLAYER_LIST
    }
    case 'Banned by an operator.': {
      clsInfo.field[line.nextOp('putfield').field.fieldName] = 'reason'
      return CLASS.BAN_DETAIL
    }
    case 'Integrated Server (map_client.txt)': {
      info.class[cls.getInterfaces()[0].getClassName()].name = CLASS.CRASH_REPORT_DETAIL
      break
    }
    case '=': {
      if (clsInfo.isInnerClass && method.getName() === 'toString') {
        info.class[clsInfo.outerClassName].name = CLASS.INT_HASH_MAP
        return 'Entry'
      }
      break
    }
    case 'chunkSource': {
      methodInfo.name = 'tick'
      info.method[line.next.call.fullSig].name = 'next'
      info.class[line.next.call.className].name = CLASS.PROFILER
      try {
        const worldInfoLine = (line.prevOp('ldc_w "mobSpawner"') || line.prevOp('ldc_w "spawner"')).nextOp('getfield')
        clsInfo.field[worldInfoLine.field.fieldName] = 'worldInfo'
        info.class[decodeType(worldInfoLine.field.type)].name = CLASS.WORLD_INFO
        const entitySpawnerLine = worldInfoLine.nextOp('getfield')
        console.log(line.prevOp('ldc_w "mobSpawner"') || line.prevOp('ldc_w "spawner"'))
        console.log(worldInfoLine)
        console.log(entitySpawnerLine)
        clsInfo.field[entitySpawnerLine.field.fieldName] = 'entitySpawner'
        info.class[decodeType(entitySpawnerLine.field.type)].name = CLASS.ENTITY_SPAWNER
      } catch (e) {
        console.error(e)
      }
      return CLASS.WORLD_SERVER
    }
    case 'box[': return CLASS.AABB
    case 'http://skins.minecraft.net/MinecraftSkins/%s.png':
      methodInfo.name = 'downloadSkin'
      info.class[method.getReturnType().getClassName()].name = CLASS.THREAD_IMAGE_DOWNLOAD
      return CLASS.ABSTRACT_CLIENT_PLAYER
    case 'Resource download thread':
      return CLASS.RESOURCE_DOWNLOAD_THREAD
    case 'textures/gui/options_background.png': return CLASS.GUI
    case 'Invalid Item!': return CLASS.GUI_SCREEN
    case 'Merry X-mas!': case 'texts/splashes.txt':
      info.class[cls.getSuperclassName()].name = CLASS.GUI_SCREEN
      info.class[cls.getSuperClasses().slice(-2)[0].getClassName()].name = CLASS.GUI
      methodInfo.name = 'initGui'
      return CLASS.GUI_MAIN_MENU
    case 'selectWorld.title': {
      const {call} = line.nextOp('invokestatic') || {}
      if (call) {
        info.class[call.fullClassName].name = CLASS.I18N
        info.method[call.fullSig].name = 'format'
      }
      clsInfo.field[line.nextOp('putfield').field.fieldName] = 'title'
      return CLASS.GUI_SELECT_WORLD
    }
    case 'selectWorld.edit.title': return 'net.minecraft.client.gui.world.GuiEditWorld'
    case 'options.customizeTitle': return 'net.minecraft.client.gui.world.GuiCustomizeWorld'
    case 'createWorld.customize.flat.title': return 'net.minecraft.client.gui.world.GuiCustomizeWorldFlat'
    case 'multiplayer.title': return CLASS.GUI_MULTIPLAYER
    case 'options.title': return 'net.minecraft.client.gui.menu.GuiOptions'
    case 'options.skinCustomisation.title': return 'net.minecraft.client.gui.menu.GuiOptionsSkinCustomisation'
    case 'constrols.resetAll': return 'net.minecraft.client.gui.menu.GuiOptionsControls'
    case 'options.languageWarning': return 'net.minecraft.client.gui.menu.GuiOptionsLanguage'
    case 'options.chat.title':
      return !code.consts.includes('options.video') && 'net.minecraft.client.gui.options.GuiOptionsChat'
    case 'options.snooper.title': return 'net.minecraft.client.gui.options.GuiOptionsSnooper'
    case 'resourcePack.openFolder': return 'net.minecraft.client.gui.options.GuiOptionsResourcePacks'
    case 'texturePack.openFolder': return 'net.minecraft.client.gui.options.GuiOptionsTexturePacks'
    case 'options.sounds.title': return 'net.minecraft.client.gui.options.GuiOptionsSounds'
    case 'Missing default of DefaultedMappedRegistry: ':
      methodInfo.name = 'validateKey'
      return 'net.minecraft.util.registry.DefaultedMappedRegistry'
    case 'blockDiamond':
      return CLASS.BLOCK
    case 'Invalid Block requested: ':
      methodInfo.name = 'getRegisteredBlock'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.block.Block'
      return CLASS.BLOCKS
    case `{Name:'minecraft:air'}`:
      return CLASS.THE_FLATTENING_BLOCK_STATES
    case 'pickaxeDiamond':
      return CLASS.ITEM
    case 'Invalid Item requested: ':
      methodInfo.name = 'getRegisteredItem'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.item.Item'
      return CLASS.ITEMS
    case 'Accessed Items before Bootstrap!':
      if (code.lines[0].call) {
        const BootstrapIsRegistered = code.lines[0].call
        info.class[BootstrapIsRegistered.fullClassName].name = CLASS.BOOTSTRAP
        info.method[BootstrapIsRegistered.fullSig].name = 'isRegistered'
      } else console.log('Expected call to Bootstrap.isRegistered:', code.lines[0])
      return
    case 'Invalid Enchantment requested: ':
      methodInfo.name = 'getRegisteredEnchantment'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.enchantment.Enchantment'
      return CLASS.ENCHANTMENTS
    case 'Getting Biome': {
      info.class[method.getReturnType().getClassName()].name = CLASS.BIOME
      methodInfo.name = 'getBiome'
      return CLASS.WORLD
    }
    case 'Plains':
      return CLASS.BIOME
    case 'Invalid Biome requested: ':
      methodInfo.name = 'getRegisteredBiome'
      info.class[method.getReturnType().getClassName()].name = CLASS.BIOME
      return CLASS.BIOMES
    case 'Invalid Potion requested: ':
      methodInfo.name = 'getRegisteredPotion'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.potion.Potion'
      return CLASS.POTIONS
    case 'Invalid MobEffect requested: ':
      methodInfo.name = 'getRegisteredMobEffect'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.potion.MobEffect'
      return CLASS.MOB_EFFETS
    case 'Invalid Sound requested: ':
      methodInfo.name = 'getRegisteredSound'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.sound.Sound'
      return CLASS.SOUNDS
    case 'screenshots':
      methodInfo.name = 'saveScreenshot'
      return 'net.minecraft.util.ScreenshotHelper'
    case 'OW KNOWS!':
      methodInfo.name = 'addPoint'
      info.class[method.getReturnType().getClassName()].name = 'net.minecraft.pathfinding.PathPoint'
      return 'net.minecraft.pathfinding.PathHeap'
    case 'deadmau5':
      if (sig.endsWith('Ljava/lang/String;DDDI)V')) return CLASS.RENDER_ENTITY
      if (sig.endsWith('FFFFFFF)V')) {
        methodInfo.name = 'renderLayer'
        info.class[cls.getSuperclassName()].name = 'net.minecraft.entity.layer.RenderLayer'
        return 'net.minecraft.client.renderer.entity.layer.LayerDeadmau5Head'
      }
      return
    case '/art/kz.png':
      info.class[cls.getSuperclassName()].name = CLASS.RENDER_ENTITY
      return CLASS.RENDER_PAINTING
    case '/item/arrows.png':
      info.class[cls.getSuperclassName()].name = CLASS.RENDER_ENTITY
      return CLASS.RENDER_ARROW
    case '/item/boat.png':
      info.class[cls.getSuperclassName()].name = CLASS.RENDER_ENTITY
      return CLASS.RENDER_BOAT
    case 'old! {}': {
      if (cls.getSuperclassName() !== 'java/lang/Enum') {
        info.class[cls.getSuperclassName()].name = CLASS.GEN_LAYER
        methodInfo.name = 'getInts'
        return CLASS.GEN_LAYER_HILLS
      }
      break
    }
    case 6364136223846793005:
      return CLASS.GEN_LAYER
    case 'Invalid Biome id':
      return CLASS.BIOME_PROVIDER
    case 'Unable to serialize an anonymous value to json!':
      return CLASS.DATA_GENERATOR
    case 'BiomeBuilder{\nsurfaceBuilder=':
      return CLASS.BIOME$BIOME_BUILDER
    case 'Something went wrong when converting from HSV to RGB. Input was ':
      return CLASS.MATH_HELPER
    case 'PooledMutableBlockPosition modified after it was released.':
      info.class[cls.getSuperclassName()].name = CLASS.BLOCK_POS$MUTABLE_BLOCK_POS
      return CLASS.BLOCK_POS$POOLED_MUTABLE_BLOCK_POS
    case 'Smelting Recipe ':
      return CLASS.SMELTING_RECIPE
    case 'ServerChunkCache: ':
      info.class[cls.getInterfaces()[0].getClassName()].name = CLASS.CHUNK_PROVIDER
      return CLASS.CHUNK_PROVIDER_SERVER
    case 'Batch already started.':
      methodInfo.name = 'startBatch'
      return CLASS.BATCH_PROCESSOR
    case -559038737: case '-559038737':
      return CLASS.CHUNK_POS
    case 'Tried to load invalid item: {}':
      return CLASS.ITEM_STACK
    case 'An ingredient entry is either a tag or an item, not both':
      return CLASS.INGREDIENT
    case 'Server console handler':
      methodInfo.name = 'startServer'
      return CLASS.DEDICATED_SERVER
    case 'Item List': return CLASS.DATA_PROVIDER_ITEMS
    case 'Block List': return CLASS.DATA_PROVIDER_BLOCKS
    case 'Advancements': return CLASS.DATA_PROVIDER_ADVANCEMENTS
    case 'data/minecraft/advancements/recipes/root.json':
      return CLASS.DATA_PROVIDER_RECIPES
    case 'Command Syntax': return CLASS.DATA_PROVIDER_COMMANDS
    case 'SNBT -> NBT': return CLASS.DATA_PROVIDER_SNBT_TO_NBT
    case 'NBT -> SNBT': return CLASS.DATA_PROVIDER_NBT_TO_SNBT
    case 'Fluid Tags': return CLASS.DATA_PROVIDER_FLUID_TAGS
    case 'Block Tags': return CLASS.DATA_PROVIDER_BLOCK_TAGS
    case 'Item Tags': return CLASS.DATA_PROVIDER_ITEM_TAGS
    case '---- Minecraft Crash Report ----\n': return CLASS.CRASH_REPORT
    case 'argument.player.unknown': return CLASS.ARGUMENT_PLAYER
    case 'argument.entity.selector.not_allowed': return CLASS.ARGUMENT_ENTITY
    case 'argument.pos.outofworld': return CLASS.ARGUMENT_BLOCKPOS
    case 'argument.pos.incomplete': return CLASS.ARGUMENT_VEC3
    case 'argument.vec2.incomplete': return CLASS.ARGUMENT_VEC2
    case 'foo{bar=baz}': return CLASS.ARGUMENT_BLOCK_STATE
    case '#stone[foo=bar]{baz=nbt}': return CLASS.ARGUMENT_BLOCK_PREDICATE
    case 'stick{foo=bar}': return CLASS.ARGUMENT_ITEM_STACK
    case '#stick{foo=bar}': return CLASS.ARGUMENT_ITEM_PREDICATE
    case 'argument.color.invalid': return CLASS.ARGUMENT_TEXT_COLOR
    case 'argument.component.invalid': return CLASS.ARGUMENT_TEXT_COMPONENT
    case 'Hello @p :)': return CLASS.ARGUMENT_MESSAGE
    case 'argument.nbt.invalid': return CLASS.ARGUMENT_NBT
    case 'arguments.nbtpath.child.invalid': return CLASS.ARGUMENT_NBT_PATH
    case 'arguments.objective.notFound': return CLASS.ARGUMENT_OBJECTIVE
    case 'argument.criteria.invalid': return CLASS.ARGUMENT_OBJECTIVE_CRITERIA
    case 'arguments.operation.invalid': return CLASS.ARGUMENT_OPERATION
    case 'particle.notFound': return CLASS.ARGUMENT_PARTICLE
    case 'argument.rotation.incomplete': return CLASS.ARGUMENT_ROTATION
    case 'argument.scoreboardDisplaySlot.invalid': return CLASS.ARGUMENT_SCOREBOARD_SLOT
    case 'argument.scoreHolder.empty': return CLASS.ARGUMENT_SCORE_HOLDER
    case 'arguments.swizzle.invalid': return CLASS.ARGUMENT_SWIZZLE
    case 'team.notFound': return CLASS.ARGUMENT_TEAM
    case 'container.5': return CLASS.ARGUMENT_ITEM_SLOT
    case 'argument.id.unknown': return CLASS.ARGUMENT_IDENTIFIER
    case 'effect.effectNotFound': return CLASS.ARGUMENT_MOB_EFFECT
    case 'arguments.function.unknown': return CLASS.ARGUMENT_FUNCTION
    case 'argument.anchor.invalid': return CLASS.ARGUMENT_ENTITY_ANCHOR
    case 'enchantment.unknown': return CLASS.ARGUMENT_ENCHANTMENT
    case 'entity.notFound': return CLASS.ARGUMENT_ENTITY_SUMMON
    case 'Could not serialize argument {} ({})!': return CLASS.COMMAND_ARGUMENTS
    case 'Accessed MobEffects before Bootstrap!': return CLASS.MOB_EFFECTS
    case 'Accessed particles before Bootstrap!': return CLASS.PARTICLES
    case 'SimpleAdvancement{id=': return CLASS.ADVANCEMENT
    case 'Query Listener': return CLASS.QUERY_LISTENER
    case 'RCON Listener':
      info.class[cls.getSuperclassName()].name = CLASS.RCON_THREAD
      info.class[method.getArgumentTypes()[0].getClassName()].name = CLASS.RCON_SERVER
      return CLASS.RCON_LISTENER
    case 'RCON Client': return CLASS.RCON_CLIENT
    case 'bred_animals':
      info.class[cls.getInterfaces()[0].getClassName()].name = CLASS.ADVANCEMENT_TRIGGER
      return CLASS.ADVANCEMENT_TRIGGER_BRED_ANIMALS
    case 'brewed_potion': return CLASS.ADVANCEMENT_TRIGGER_BREWED_POTION
    case 'changed_dimension': return CLASS.ADVANCEMENT_TRIGGER_CHANGED_DIMENSION
    case 'channeled_lightning': return CLASS.ADVANCEMENT_TRIGGER_CHANNELED_LIGHTNING
    case 'construct_beacon': return CLASS.ADVANCEMENT_TRIGGER_CONSTRUCT_BEACON
    case 'consume_item': return CLASS.ADVANCEMENT_TRIGGER_CONSUME_ITEM
    case 'cured_zombie_villager': return CLASS.ADVANCEMENT_TRIGGER_CURED_ZOMBIE_VILLAGER
    case 'source_entity':
      return code.consts.includes('is_fire') ? CLASS.ADVANCEMENT_TRIGGER_DAMAGE_SOURCE : CLASS.ADVANCEMENT_TRIGGER_DAMAGE
    case 'effects_changed': return CLASS.ADVANCEMENT_TRIGGER_EFFECTS_CHANGED
    case 'enchanted_item':
      if (method.getName() !== '<clinit>') return
      return CLASS.ADVANCEMENT_TRIGGER_ENCHANTED_ITEM
    case 'enter_block': return CLASS.ADVANCEMENT_TRIGGER_ENTER_BLOCK
    case 'entity_hurt_player': return CLASS.ADVANCEMENT_TRIGGER_ENTITY_HURT_PLAYER
    case 'filled_bucket': return CLASS.ADVANCEMENT_TRIGGER_FILLED_BUCKET
    case 'fishing_rod_hooked': return CLASS.ADVANCEMENT_TRIGGER_FISHING_ROD_HOOKED
    case 'impossible':
      if (method.getName() !== '<clinit>') return
      return CLASS.ADVANCEMENT_TRIGGER_IMPOSSIBLE
    case 'inventory_changed': return CLASS.ADVANCEMENT_TRIGGER_INVENTORY_CHANGED
    case 'item_durability_changed': return CLASS.ADVANCEMENT_TRIGGER_ITEM_DURABILITY_CHANGED
    case 'killing_blow':
      if (clsInfo.isInnerClass) return 'Instance'
      return CLASS.ADVANCEMENT_TRIGGER_KILL
    case 'levitation':
      if (line.next.op !== 'invokespecial') return
      return CLASS.ADVANCEMENT_TRIGGER_LEVITATION
    case 'nether_travel': return CLASS.ADVANCEMENT_TRIGGER_NETHER_TRAVEL
    case 'placed_block': return CLASS.ADVANCEMENT_TRIGGER_PLACED_BLOCK
    case 'player_hurt_entity': return CLASS.ADVANCEMENT_TRIGGER_PLAYER_HURT_ENTITY
    case 'recipe_unlocked': return CLASS.ADVANCEMENT_TRIGGER_RECIPE_UNLOCKED
    case 'summoned_entity': return CLASS.ADVANCEMENT_TRIGGER_SUMMONED_ENTITY
    case 'tame_animal': return CLASS.ADVANCEMENT_TRIGGER_TAME_ANIMAL
    case 'tick':
      if (method.getName() !== '<clinit>') return
      if (code.consts.includes('functions/')) return CLASS.FUNCTION_MANAGER
      return CLASS.ADVANCEMENT_TRIGGER_TICK
    case 'used_ender_eye': return CLASS.ADVANCEMENT_TRIGGER_USED_ENDER_EYE
    case 'used_totem':
      if (method.getName() !== '<clinit>') return
      return CLASS.ADVANCEMENT_TRIGGER_USED_TOTEM
    case 'villager_trade': return CLASS.ADVANCEMENT_TRIGGER_VILLAGER_TRADE
    case 'Duplicate criterion id ': return CLASS.ADVANCEMENT_CRITERIA
    case 'AbstractCriterionInstance{criterion=': return CLASS.ADVANCEMENT_ABSTRACT_CRITERION_INSTANCE
    case 'interact_with_brewingstand': return CLASS.STATISTICS
    case 'RequiredPlayerRange': return CLASS.SPAWNER_LOGIC
    case 'Enchant':
      info.class[cls.getSuperclassName()].name = CLASS.CONTAINER
      return CLASS.CONTAINER_ENCHANTMENT
    case '10387319': return CLASS.STRUCTURE_WOODLAND_MANSION
    case 'Skipping Structure with id {}': return CLASS.STRUCTURES
    case 'World optimizaton finished after {} ms': return CLASS.WORLD_OPTIMIZER
    case 'optimizeWorld.info.converted': return CLASS.GUI_SCREEN_OPTIMIZE_WORLD
    case 'ThreadedAnvilChunkStorage ({}): All chunks are saved': return CLASS.THREADED_ANVIL_CHUNK_STORAGE
    case 'lang/%s.lang': case 'lang/%s.json': return CLASS.I18N_LOCALE
  }
  if (c === 'PigZombie' && /^[a-z]{1,3}$/.test(line.previous.const)) return CLASS.ENTITIES
  if (c === 'Bad packet id' && sig.startsWith('(Ljava/io/DataInputStream;)L')) {
    methodInfo.name = 'decode'
    return 'net.minecraft.network.Packet'
  }
  if (c.startsWith('Skipping BlockEntity') || c.startsWith('Skipping TileEntity')) {
    methodInfo.name = 'fromNBT'
    return CLASS.BLOCK_ENTITY
  }
  if (c === 'c.' && code.consts.includes(36) && code.consts.includes('.dat')) {
    methodInfo.name = 'getFileForChunk'
    return CLASS.ALPHA_CHUNK_LOADER
  }
  if (c.startsWith('Wrong location!')) {
    methodInfo.name = 'addEntity'
    return CLASS.CHUNK
  }
  if (c.startsWith('fossils/')) {
    info.class[cls.getSuperclassName()].name = CLASS.WORLD_GENERATOR
    return CLASS.WORLD_GEN_FOSSILS
  }
  if (/^commands\.(.*?)\.$/.test(c)) {
    const commandName = c.match(/^commands\.(.*?)\.$/)[1]
    if (commandName.indexOf('.') >= 0) return
    return PKG.COMMAND + '.Command' + toUpperCamelCase(commandName)
  }
  if (c.startsWith('Starting integrated minecraft server version')) return CLASS.INTEGRATED_SERVER
  if (c.endsWith('Fix') && hasSuperClass(cls, 'com.mojang.datafixers.DataFix')) return PKG.DATAFIX + '.' + c
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  methodInfo.done = false
  const sig = method.getSignature()
  const sc = cls.getSuperclassName()
  if (sc === 'java.lang.Enum') {
    if (method.getName() === '<clinit>') enumClinit(cls, method, code, methodInfo, clsInfo, info)
    else if (method.getName() === 'values') {
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
  for (const line of code.lines) {
    if (line.op === 'new' && line.arg.slice(1, -1) === cls.getClassName().replace(/\./g, '/')) {
      const ldc = line.nextOp('ldc')
      if (!ldc || !/^[A-Za-z_\d]+$/.test(ldc.const)) continue
      const putstatic = ldc.nextOp('putstatic')
      if (!putstatic) continue
      const name = ldc.const.toUpperCase()
      clsInfo.field[putstatic.field.fieldName] = name
      names.push(name)
      switch (ldc.const) {
        case 'SkullAndRoses': clsInfo.name = 'net.minecraft.entity.item.PaintingType'; break
      }
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
    case 'GROWING,SHRINKING,STATIONARY': return CLASS.BORDER_STATUS
    case 'SAVE,LOAD,CORNER,DATA': return CLASS.STRUCTURE_BLOCK_MODE
    case 'PROTOCHUNK,LEVELCHUNK': return CLASS.CHUNK_STAGE$TYPE
    case 'DEFAULT,STICKY': return CLASS.PISTON_TYPE
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
