import {signatureTag as s} from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'
import * as PKG from '../../../../PackageNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const Block = clsInfo.obfName
  if (code.consts.includes('cobblestone')) {
    info.data.blocks = {
      post () {
        for (const data of Object.values(this)) {
          data.class = info.class[data.class].name || data.class
        }
      }
    }
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      const data = {}
      if (line.next.op === 'new') data.class = line.next.className
      const blockClass = classNames[line.const]
      if (blockClass) {
        const newCls = line.nextOp('new').className
        if (newCls !== Block) info.class[newCls].name = PKG.BLOCK + '.' + blockClass
      }
      const regBlock = line.nextOp('invokestatic')
      if (regBlock) info.data.blocks[line.const] = data
      if (!regBlock || !/^\(IL[^;]+;L[^;]+;\)V$/.test(regBlock.call.signature)) continue
      info.method[regBlock.call.fullSig].name = 'registerBlock'
    }
    return 'registerBlocks'
  }
  if (code.consts.includes('Don\'t know how to convert ') && code.consts.includes(' back into data...')) {
    methodInfo.name = 'getMetaFromState'
    info.class[methodInfo.args[0].getClassName()].name = CLASS.BLOCK_STATE
  }
  if (methodInfo.origName === '<init>' && methodInfo.args.length === 2 && sig.startsWith('(L')) {
    info.class[methodInfo.args[0].getClassName()].name = CLASS.MATERIAL
  }
  if (methodInfo.origName === '<init>' && methodInfo.args.length === 1) {
    const arg0 = methodInfo.args[0].getClassName()
    info.class[arg0].name = arg0.includes('$') ? CLASS.BLOCK$BUILDER : CLASS.MATERIAL
  }
  if (methodInfo.origName === '<clinit>') {
    for (const line of code.lines) {
      if (!line.const || line.const !== 'air') continue
      info.class[line.prevOp('new').arg.slice(1, -1)].name = CLASS.RESOURCE_LOCATION
    }
  }
  if (s`(DDDDDD)${CLASS.VOXEL_SHAPE}`.matches(methodInfo)) return 'createShape'
  switch (sig) {
    case '(Ljava/lang/String;L' + Block + ';)V': return 'registerBlock'
  }
}

export function field (fieldInfo) {
  const {sig, clsInfo, info} = fieldInfo
  switch (sig) {
    case 'Ljava/lang/String;': return 'name'
    case 'I': return 'lightOpacity'
  }
  const MapColor = info.classReverse[CLASS.MAP_COLOR]
  const DefaultedMappedRegistry = info.classReverse[CLASS.DEFAULTED_MAPPED_REGISTRY]
  const BlockState = info.classReverse[CLASS.BLOCK_STATE]
  if (!MapColor || !DefaultedMappedRegistry || !BlockState) clsInfo.done = false
  if (MapColor && sig === 'L' + MapColor + ';') return 'mapColor'
  if (DefaultedMappedRegistry && sig === 'L' + DefaultedMappedRegistry + ';') return 'REGISTRY'
  if (BlockState && sig === 'L' + BlockState + ';') return 'defaultBlockState'
}

const classNames = {
  grass_block: 'GrassBlock',
  podzol: 'Podzol',
  bedrock: 'Bedrock',
  water: 'Liquid',
  sand: 'Sand',
  gravel: 'Gravel',
  gold_ore: 'Ore',
  stripped_spruce_log: 'Log',
  stripped_oak_wood: 'Wood',
  oak_leaves: 'Leaves',
  sponge: 'Sponge',
  wet_sponge: 'WetSponge',
  glass: 'Glass',
  dispenser: 'Dispenser',
  note_block: 'NoteBlock',
  white_bed: 'Bed',
  powered_rail: 'PoweredRail',
  detector_rail: 'DetectorRail',
  sticky_piston: 'Piston',
  cobweb: 'CobWeb',
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
  wheat: 'Wheat',
  furnace: 'Furnace',
  sign: 'StandingSign',
  oak_door: 'Door',
  ladder: 'Ladder',
  rail: 'Rail',
  wall_sign: 'WallSign',
  lever: 'Lever',
  stone_pressure_plate: 'PressurePlate',
  redstone_ore: 'RedstoneOre',
  redstone_torch: 'RedstoneTorch',
  redstone_wall_torch: 'RedstoneWallTorch',
  stone_button: 'StoneButton',
  snow: 'Snow',
  ice: 'Ice',
  snow_block: 'SnowBlock',
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
  mushroom_stem: 'MushroomBlock',
  iron_bars: 'IronBars',
  glass_pane: 'GlassPane',
  attached_pumpkin_stem: 'AttachedStem',
  pumpkin_stem: 'Stem',
  vine: 'Vine',
  oak_fence_gate: 'FenceGate',
  mycelium: 'Mycelium',
  lily_pad: 'LilyPad',
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
  cobblestone_wall: 'CobblestoneWall',
  flower_pot: 'FlowerPot',
  carrots: 'Carrots',
  potatoes: 'Potatoes',
  oak_button: 'WoodButton',
  skeleton_wall_skull: 'WallHead',
  skeleton_skull: 'NormalHead',
  wither_skeleton_wall_skull: 'WitherSkeletonWallSkull',
  wither_skeleton_skull: 'WitherSkeletonSkull',
  player_wall_head: 'PlayerWallHead',
  player_head: 'PlayerHead',
  anvil: 'Anvil',
  light_weighted_pressure_plate: 'WeightedPressurePlate',
  trapped_chest: 'TrappedChest',
  comparator: 'BlockComparator',
  daylight_detector: 'DaylightDetector',
  redstone_block: 'RedstoneBlock',
  hopper: 'Hopper',
  dropper: 'Dropper',
  white_stained_glass_pane: 'StainedGlassPane',
  slime_block: 'SlimeBlock',
  barrier: 'Barrier',
  prismarine_slab: 'Slab',
  sea_lantern: 'SeaLantern',
  hay_block: 'HayBlock',
  white_carpet: 'Carpet',
  packed_ice: 'PackedIce',
  sunflower: 'TallFlower',
  tall_grass: 'TallGrass',
  white_banner: 'StandingBanner',
  white_wall_banner: 'WallBanner',
  end_rod: 'EndRod',
  chorus_flower: 'ChorusFlower',
  beetroots: 'Beetroots',
  end_gateway: 'EndGateway',
  repeating_command_block: 'CommandBlock',
  frosted_ice: 'FrostedIce',
  magma_block: 'MagmaBlock',
  structure_void: 'StructureVoid',
  observer: 'Observer',
  shulker_box: 'ShulkerBox',
  white_glazed_terracotta: 'GlazedTerracotta',
  white_concrete_powder: 'ConcretePowder',
  kelp_plant: 'KelpPlant',
  turtle_egg: 'TurtleEgg',
  tube_coral_block: 'CoralBlock',
  tube_coral: 'Coral',
  tube_coral_wall_fan: 'CoralWallFan',
  tube_coral_fan: 'CoralFan',
  sea_pickle: 'SeaPickle',
  blue_ice: 'BlueIce',
  conduit: 'Conduit',
  void_air: 'Air',
  bubble_column: 'BubbleColumn',
  structure_block: 'StructureBlock'
}
