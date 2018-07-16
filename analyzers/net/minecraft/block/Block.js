import * as CLASS from '../../../../ClassNames'
import * as PKG from '../../../../PackageNames'

export function cls (cls, clsInfo, info) {
  const ifs = cls.getInterfaces()
  if (ifs.length === 1) {
    info.class[ifs[0].getClassName()].name = CLASS.ITEMIZABLE
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  const args = method.getArgumentTypes()
  const name = method.getName()
  const Block = clsInfo.obfName
  if (code.consts.includes('cobblestone')) {
    for (const line of code.lines) {
      if (!line.const) continue
      const blockClass = getBlockClass(line.const)
      if (blockClass) {
        const newCls = line.nextOp('new').arg
        if (newCls !== Block) info.class[newCls].name = PKG.BLOCK + '.' + blockClass
      }
      const regBlock = line.nextOp('invokestatic')
      if (!/^\(IL[^;]+;L[^;]+;\)V$/.test(regBlock.call.signature)) break
      info.method[regBlock.call.fullSig].name = 'registerBlock'
    }
    return 'registerBlocks'
  }
  if (code.consts.includes('Don\'t know how to convert ') && code.consts.includes(' back into data...')) {
    methodInfo.name = 'getMetaFromState'
    info.class[args[0].getClassName()].name = CLASS.BLOCK_STATE
  }
  if (name === '<init>' && args.length === 2 && sig.startsWith('(L')) {
    info.class[args[0].getClassName()].name = CLASS.MATERIAL
  }
  if (name === '<clinit>') {
    for (const line of code.lines) {
      if (!line.const || line.const !== 'air') continue
      info.class[line.prevOp('new').arg.slice(1, -1)].name = CLASS.RESOURCE_LOCATION
    }
  }
  switch (sig) {
    case '(Ljava/lang/String;L' + Block + ';)V': return 'registerBlock'
  }
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  const MapColor = info.classReverse[CLASS.MAP_COLOR]
  const DefaultedMappedRegistry = info.classReverse[CLASS.DEFAULTED_MAPPED_REGISTRY]
  if (!MapColor || !DefaultedMappedRegistry) clsInfo.done = false
  if (MapColor && sig === 'L' + MapColor + ';') return 'mapColor'
  if (DefaultedMappedRegistry && sig === 'L' + DefaultedMappedRegistry + ';') return 'REGISTRY'
  switch (sig) {
    case 'Ljava/lang/String;': return 'name'
  }
}

function getBlockClass (name) {
  switch (name) {
    case 'grass_block': return 'GrassBlock'
    case 'podzol': return 'Podzol'
    case 'water': return 'Fluid'
    case 'sand': return 'Sand'
    case 'gravel': return 'Gravel'
    case 'gold_ore': return 'Ore'
    case 'stripped_spruce_log': return 'Log'
    case 'stripped_oak_wood': return 'Wood'
    case 'oak_leaves': return 'Leaves'
    case 'sponge': return 'Sponge'
    case 'wet_sponge': return 'WetSponge'
    case 'glass': return 'Glass'
    case 'dispenser': return 'Dispenser'
    case 'note_block': return 'NoteBlock'
    case 'white_bed': return 'Bed'
    case 'powered_rail': return 'PoweredRail'
    case 'detector_rail': return 'DetectorRail'
    case 'sticky_piston': return 'Piston'
    case 'cobweb': return 'CobWeb'
    case 'piston_head': return 'PistonHead'
    case 'mobing_piston': return 'MovingPiston'
    case 'tnt': return 'Tnt'
    case 'bookshelf': return 'Bookshelf'
    case 'torch': return 'Torch'
    case 'wall_torch': return 'WallTorch'
    case 'fire': return 'Fire'
    case 'spawner': return 'Spawner'
    case 'oak_stairs': return 'Stairs'
    case 'chest': return 'Chest'
    case 'redstone_wire': return 'RedstoneWire'
    case 'crafting_table': return 'CraftingTable'
    case 'wheat': return 'Wheat'
    case 'furnace': return 'Furnace'
  }
}
