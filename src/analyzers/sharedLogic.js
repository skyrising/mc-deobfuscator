// @flow
import * as PKG from '../PackageNames'
import * as CLASS from '../ClassNames'
import { lcFirst } from '../util'

export type Options = {
  filterOut?: Array<string>;
  filter?: (id: string, idLine: CodeLineLoadConst) => any;
  eval?: (id: string, idLine: CodeLineLoadConst, field: FieldInfo) => any;
  post?: (data: {[string]: any}) => any;
}

export function registryMethod (methodInfo: MethodInfo, dataKey: string = '', opts: Options = {}) {
  const { clsInfo, info } = methodInfo
  const { lines } = methodInfo.code
  const setData = dataKey && !(dataKey in info.data)
  if (methodInfo.obfName === '<clinit>') {
    if (setData) info.data[dataKey] = {}
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (typeof (line: any).const !== 'string') continue
      const id: string = ((line: any).const: any)
      if (opts.filterOut && opts.filterOut.includes(id)) continue
      if (opts.filter && !opts.filter(id, (line: any))) continue
      if (!/^[a-z_\d]+$/.test(id)) continue
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      const field = clsInfo.fields[putstatic.field.fieldName]
      field.name = id.toUpperCase()
      const data = (opts.eval && opts.eval(id, (line: any), field)) || {}
      if (setData) info.data[dataKey][id] = data
      i = lines.indexOf(putstatic)
    }
    if (opts.post) opts.post(info.data[dataKey])
    return methodInfo.obfName
  }
}

export function registerBlocks (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  const Block = info.classReverse[CLASS.BLOCK]
  if (!Block) return
  info.data.blocks = {}
  const BlockProperties = info.classReverse[CLASS.BLOCK_PROPERTIES]
  const blockPropertiesCls = BlockProperties && info.class[BlockProperties]
  for (const line of code.lines) {
    if (typeof line.const !== 'string') continue
    const data = {}
    if (line.next.op === 'new') {
      const blockCls = info.class[line.next.className]
      data.class = blockCls
      try {
        if (BlockProperties && blockCls) {
          const blockClinit = '<clinit>:()V' in blockCls.method && blockCls.method['<clinit>:()V']
          if (blockClinit) {
            for (const line of blockClinit.code.lines) {
              if (line.op !== 'getstatic') continue
              if (line.field.className !== BlockProperties) continue
              const putstatic = line.nextOp('putstatic')
              if (!putstatic) break
              if (putstatic.field.className !== blockCls.obfName) continue
              blockCls.fields[putstatic.field.fieldName].depends = blockPropertiesCls.fields[line.field.fieldName]
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    const blockClass = BLOCK_CLASS_NAMES[line.const]
    if (blockClass) {
      const newCls = line.nextOp('new').className
      if (newCls !== Block) info.class[newCls].name = PKG.BLOCK + '.' + blockClass + 'Block'
    }
    const regBlock = line.nextOp('invokestatic')
    if (regBlock) info.data.blocks[line.const] = data
    if (!regBlock || !/^\(IL[^;]+;L[^;]+;\)V$/.test(regBlock.call.signature)) continue
    info.method[regBlock.call.fullSig].name = 'registerBlock'
  }
}

export function nameBlocks (info: FullInfo, map: {[string]: string}) {
  const lists = {}
  for (const id in map) {
    if (!lists[map[id]]) lists[map[id]] = []
    lists[map[id]].push(id)
  }
}

// TODO: switch to commonWords like decorators
export const BLOCK_CLASS_NAMES = {
  grass_block: 'Grass',
  podzol: 'Podzol',
  bedrock: 'Bedrock',
  water: 'Fluid',
  sand: 'Sand',
  gravel: 'Gravel',
  gold_ore: 'Ore',
  stripped_spruce_log: 'Log',
  stripped_oak_wood: 'Wood',
  oak_leaves: 'Leaves',
  oak_sapling: 'Sapling',
  sponge: 'Sponge',
  wet_sponge: 'WetSponge',
  glass: 'Glass',
  dispenser: 'Dispenser',
  note_block: 'Note',
  white_bed: 'Bed',
  powered_rail: 'PoweredRail',
  detector_rail: 'DetectorRail',
  sticky_piston: 'Piston',
  cobweb: 'Web',
  piston_head: 'PistonHead',
  moving_piston: 'MovingPiston',
  tnt: 'Tnt',
  bookshelf: 'Bookshelf',
  torch: 'StandingTorch',
  wall_torch: 'WallTorch',
  fire: 'Fire',
  spawner: 'Spawner',
  oak_stairs: 'Stairs',
  chest: 'Chest',
  redstone_wire: 'RedstoneWire',
  crafting_table: 'CraftingTable',
  wheat: 'Crop',
  furnace: 'Furnace',
  sign: 'StandingSign',
  oak_sign: 'StandingSign',
  oak_door: 'Door',
  ladder: 'Ladder',
  rail: 'Rail',
  wall_sign: 'WallSign',
  oak_wall_sign: 'WallSign',
  lever: 'Lever',
  stone_pressure_plate: 'PressurePlate',
  redstone_ore: 'RedstoneOre',
  redstone_torch: 'RedstoneTorch',
  redstone_wall_torch: 'RedstoneWallTorch',
  stone_button: 'StoneButton',
  ice: 'Ice',
  snow_block: 'Snow',
  clay: 'Clay',
  sugar_cane: 'SugarCane',
  jukebox: 'Jukebox',
  oak_fence: 'Fence',
  soul_sand: 'SoulSand',
  glowstone: 'Glowstone',
  nether_portal: 'NetherPortal',
  carved_pumpkin: 'CarvedPumpkin',
  cake: 'Cake',
  repeater: 'Repeater',
  white_stained_glass: 'StainedGlass',
  oak_trapdoor: 'Trapdoor',
  infested_stone: 'InfestedStone',
  mushroom_stem: 'Mushroom',
  iron_bars: 'IronBars',
  glass_pane: 'GlassPane',
  attached_pumpkin_stem: 'AttachedStem',
  pumpkin_stem: 'Stem',
  vine: 'Vine',
  oak_fence_gate: 'FenceGate',
  mycelium: 'Mycelium',
  lily_pad: 'Waterlily',
  nether_wart: 'NetherWart',
  enchanting_table: 'EnchantingTable',
  brewing_stand: 'BrewingStand',
  cauldron: 'Cauldron',
  end_portal: 'EndPortal',
  end_portal_frame: 'EndPortalFrame',
  dragon_egg: 'DragonEgg',
  redstone_lamp: 'RedstoneLamp',
  cocoa: 'Cocoa',
  ender_chest: 'EnderChest',
  tripwire: 'Tripwire',
  beacon: 'Beacon',
  cobblestone_wall: 'Wall',
  flower_pot: 'FlowerPot',
  carrots: 'Carrots',
  potatoes: 'Potatoes',
  oak_button: 'WoodButton',
  skeleton_wall_skull: 'WallSkull',
  skeleton_skull: 'Skull',
  wither_skeleton_wall_skull: 'WitherSkeletonWallSkull',
  wither_skeleton_skull: 'WitherSkeletonSkull',
  player_wall_head: 'PlayerWallHead',
  player_head: 'PlayerHead',
  anvil: 'Anvil',
  light_weighted_pressure_plate: 'WeightedPressurePlate',
  trapped_chest: 'TrappedChest',
  comparator: 'BlockComparator',
  daylight_detector: 'DaylightDetector',
  redstone_block: 'Redstone',
  hopper: 'Hopper',
  dropper: 'Dropper',
  white_stained_glass_pane: 'StainedGlassPane',
  slime_block: 'Slime',
  barrier: 'Barrier',
  prismarine_slab: 'Slab',
  sea_lantern: 'SeaLantern',
  hay_block: 'Hay',
  white_carpet: 'Carpet',
  packed_ice: 'PackedIce',
  sunflower: 'TallFlower',
  tall_grass: 'TallPlant',
  white_banner: 'StandingBanner',
  white_wall_banner: 'WallBanner',
  end_rod: 'EndRod',
  chorus_flower: 'ChorusFlower',
  beetroots: 'Beetroots',
  end_gateway: 'EndGateway',
  repeating_command_block: 'Command',
  frosted_ice: 'FrostedIce',
  magma_block: 'Magma',
  structure_void: 'StructureVoid',
  observer: 'Observer',
  shulker_box: 'ShulkerBox',
  white_glazed_terracotta: 'GlazedTerracotta',
  white_concrete_powder: 'ConcretePowder',
  kelp: 'Kelp',
  kelp_plant: 'KelpPlant',
  turtle_egg: 'TurtleEgg',
  tube_coral_block: 'CoralBlock',
  tube_coral: 'Coral',
  dead_tube_coral: 'DeadCoral',
  tube_coral_wall_fan: 'CoralWallFan',
  dead_tube_coral_wall_fan: 'DeadCoralWallFan',
  tube_coral_fan: 'CoralFan',
  dead_tube_coral_fan: 'DeadCoralFan',
  sea_pickle: 'SeaPickle',
  blue_ice: 'Transparent',
  conduit: 'Conduit',
  void_air: 'Air',
  bubble_column: 'BubbleColumn',
  structure_block: 'Structure',
  bamboo: 'Bamboo',
  bamboo_sapling: 'BambooSapling',
  loom: 'Loom',
  barrel: 'Barrel',
  smoker: 'Smoker',
  blast_furnace: 'BlastFurnace',
  cartography_table: 'CartographyTable',
  fletching_table: 'FletchingTable',
  grindstone: 'Grindstone',
  lectern: 'Lectern',
  smithing_table: 'SmithingTable',
  stonecutter: 'Stonecutter',
  bell: 'Bell',
  scaffolding: 'Scaffolding',
  grass: 'Fern',
  dead_bush: 'DeadBush',
  seagrass: 'Seagrass',
  tall_seagrass: 'TallSeagrass',
  melon: 'Melon',
  lantern: 'Lantern',
  campfire: 'Campfire',
  sweet_berry_bush: 'SweetBerryBush',
  jigsaw: 'Jigsaw',
  composter: 'Composter'
}

export function toStringFieldNamer (methodInfo: MethodInfo) {
  const { clsInfo } = methodInfo
  for (const c of methodInfo.code.constants) {
    if (c.type !== 'string') continue
    const nextField = c.line.nextOp('getfield')
    if (!nextField) return
    const match = c.value.match(/([a-zA-Z]+)=$/)
    if (!match) continue
    const name = match[1]
    clsInfo.fields[nextField.field.fieldName].name = name
  }
}

export function anyConstuctorFieldNamer (clsInfo: ClassInfo, names: Array<?string>) {
  if (clsInfo.enumNames) names.unshift(null, null)
  for (const md of Object.values(clsInfo.method)) {
    if (md.obfName !== '<init>') continue
    if (md.argSigs.length !== names.length) continue
    constructorFieldNamer(md, names)
    break
  }
}

export function constructorFieldNamer (methodInfo: MethodInfo, names: Array<?string>) {
  const { clsInfo, argOffsetsInv } = methodInfo
  methodInfo.argNames = methodInfo.argNames || []
  for (const line of methodInfo.code.lines) {
    if (!line.load) continue
    const index = argOffsetsInv[line.load]
    const name = names[index]
    if (!name) continue
    methodInfo.argNames[index] = name
    const putfield = line.next
    if (putfield.op !== 'putfield') continue
    clsInfo.fields[putfield.field.fieldName].name = name
  }
}

export function nbtFieldNamer (methodInfo: MethodInfo, mappings: {[string]: Array<string>|string} = {}) {
  const { clsInfo, info } = methodInfo
  for (const c of methodInfo.code.constants) {
    if (c.type !== 'string' || !c.value) continue
    let mapping = mappings[c.value] || lcFirst(c.value)
    if (!Array.isArray(mapping)) mapping = [mapping]
    let line = c.line.next
    for (let i = 0; i < mapping.length && line;) {
      if (line.op === 'getfield' && line.field.className === clsInfo.obfName) {
        clsInfo.fields[line.field.fieldName].name = mapping[i++]
      } else if (line.call && line.call.className === info.classReverse[CLASS.NBT_COMPOUND]) {
        break
      }
      line = line.next
    }
  }
}
