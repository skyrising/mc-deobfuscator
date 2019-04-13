// @flow

import { signatureTag as s } from '../../../../util/code'
import * as CLASS from '../../../../ClassNames'
import * as PKG from '../../../../PackageNames'
import { toUpperCamelCase, toUnderScoreCase } from '../../../../util'

const ENTITY_PKG = {
  AreaEffectCloud: PKG.ENTITY_EFFECT,
  ArmorStand: PKG.ENTITY_ITEM,
  Arrow: PKG.ENTITY_PROJECTILE,
  Bat: PKG.ENTITY_PASSIVE,
  Blaze: PKG.ENTITY_MONSTER,
  Boat: PKG.ENTITY_VEHICLE,
  CaveSpider: PKG.ENTITY_MONSTER,
  ChestMinecart: PKG.ENTITY_VEHICLE,
  Chicken: PKG.ENTITY_PASSIVE,
  CommandblockMinecart: PKG.ENTITY_VEHICLE,
  CommandBlockMinecart: PKG.ENTITY_VEHICLE,
  Cod: PKG.ENTITY_PASSIVE,
  Cow: PKG.ENTITY_PASSIVE,
  Creeper: PKG.ENTITY_MONSTER,
  Dolphin: PKG.ENTITY_PASSIVE,
  Donkey: PKG.ENTITY_PASSIVE,
  DragonFireball: PKG.ENTITY_PROJECTILE,
  Drowned: PKG.ENTITY_MONSTER,
  Egg: PKG.ENTITY_PROJECTILE,
  ElderGuardian: PKG.ENTITY_MONSTER,
  EndCrystal: PKG.ENTITY_ITEM,
  EnderCrystal: PKG.ENTITY_ITEM,
  EnderDragon: PKG.ENTITY_BOSS,
  Enderman: PKG.ENTITY_MONSTER,
  Endermite: PKG.ENTITY_MONSTER,
  EnderPearl: PKG.ENTITY_PROJECTILE,
  EvocationFangs: PKG.ENTITY_PROJECTILE,
  EvocationIllager: PKG.ENTITY_MONSTER,
  Evoker: PKG.ENTITY_MONSTER,
  EvokerFangs: PKG.ENTITY_PROJECTILE,
  ExperienceBottle: PKG.ENTITY_ITEM,
  ExperienceOrb: PKG.ENTITY_ITEM,
  EyeOfEnder: PKG.ENTITY_ITEM,
  EyeOfEnderSignal: PKG.ENTITY_ITEM,
  FallingBlock: PKG.ENTITY_ITEM,
  FallingSand: PKG.ENTITY_ITEM,
  Fireball: PKG.ENTITY_PROJECTILE,
  FireworkRocket: PKG.ENTITY_PROJECTILE,
  FireworksRocketEntity: PKG.ENTITY_PROJECTILE,
  FishingBobber: PKG.ENTITY_ITEM,
  Fox: PKG.ENTITY_PASSIVE,
  Ghast: PKG.ENTITY_MONSTER,
  Giant: PKG.ENTITY_MONSTER,
  Guardian: PKG.ENTITY_MONSTER,
  Horse: PKG.ENTITY_PASSIVE,
  Husk: PKG.ENTITY_MONSTER,
  IllagerBeast: PKG.ENTITY_MONSTER,
  Illusioner: PKG.ENTITY_MONSTER,
  IllusionIllager: PKG.ENTITY_MONSTER,
  Item: PKG.ENTITY_ITEM,
  ItemFrame: PKG.ENTITY_ITEM,
  IronGolem: PKG.ENTITY_PASSIVE,
  LavaSlime: PKG.ENTITY_MONSTER,
  LeashKnot: PKG.ENTITY_ITEM,
  LightningBolt: PKG.ENTITY_EFFECT,
  Llama: PKG.ENTITY_PASSIVE,
  LlamaSpit: PKG.ENTITY_PROJECTILE,
  MagmaCube: PKG.ENTITY_MONSTER,
  Minecart: PKG.ENTITY_VEHICLE,
  Mooshroom: PKG.ENTITY_PASSIVE,
  Mule: PKG.ENTITY_PASSIVE,
  MushroomCow: PKG.ENTITY_PASSIVE,
  Ocelot: PKG.ENTITY_PASSIVE,
  Ozelot: PKG.ENTITY_PASSIVE,
  Painting: PKG.ENTITY_ITEM,
  Panda: PKG.ENTITY_PASSIVE,
  Parrot: PKG.ENTITY_PASSIVE,
  Phantom: PKG.ENTITY_MONSTER,
  Pig: PKG.ENTITY_PASSIVE,
  PigZombie: PKG.ENTITY_MONSTER,
  Pillager: PKG.ENTITY_MONSTER,
  PolarBear: PKG.ENTITY_PASSIVE,
  PrimedTnt: PKG.ENTITY_ITEM,
  Pufferfish: PKG.ENTITY_PASSIVE,
  Rabbit: PKG.ENTITY_PASSIVE,
  Salmon: PKG.ENTITY_PASSIVE,
  Sheep: PKG.ENTITY_PASSIVE,
  Shulker: PKG.ENTITY_MONSTER,
  ShulkerBullet: PKG.ENTITY_PROJECTILE,
  Silverfish: PKG.ENTITY_MONSTER,
  Skeleton: PKG.ENTITY_MONSTER,
  SkeletonHorse: PKG.ENTITY_MONSTER,
  Slime: PKG.ENTITY_MONSTER,
  SmallFireball: PKG.ENTITY_PROJECTILE,
  Snowball: PKG.ENTITY_PROJECTILE,
  SnowGolem: PKG.ENTITY_PASSIVE,
  SnowMan: PKG.ENTITY_PASSIVE,
  SpectralArrow: PKG.ENTITY_PROJECTILE,
  Spider: PKG.ENTITY_MONSTER,
  Squid: PKG.ENTITY_PASSIVE,
  Stray: PKG.ENTITY_MONSTER,
  ThrownEgg: PKG.ENTITY_PROJECTILE,
  ThrownEnderpearl: PKG.ENTITY_PROJECTILE,
  ThrownExpBottle: PKG.ENTITY_PROJECTILE,
  ThrownPotion: PKG.ENTITY_PROJECTILE,
  Tnt: PKG.ENTITY_ITEM,
  TraderLlama: PKG.ENTITY_PASSIVE,
  Trident: PKG.ENTITY_PROJECTILE,
  TropicalFish: PKG.ENTITY_PASSIVE,
  Turtle: PKG.ENTITY_PASSIVE,
  Vex: PKG.ENTITY_MONSTER,
  Villager: PKG.ENTITY_PASSIVE,
  VillagerGolem: PKG.ENTITY_PASSIVE,
  VindicationIllager: PKG.ENTITY_MONSTER,
  Vindicator: PKG.ENTITY_MONSTER,
  WanderingTrader: PKG.ENTITY_PASSIVE,
  Witch: PKG.ENTITY_MONSTER,
  Wither: PKG.ENTITY_BOSS,
  WitherBoss: PKG.ENTITY_BOSS,
  WitherSkeleton: PKG.ENTITY_MONSTER,
  WitherSkull: PKG.ENTITY_ITEM,
  Wolf: PKG.ENTITY_PASSIVE,
  Zombie: PKG.ENTITY_MONSTER,
  ZombieHorse: PKG.ENTITY_MONSTER,
  ZombiePigman: PKG.ENTITY_MONSTER,
  ZombieVillager: PKG.ENTITY_MONSTER,
  XPOrb: PKG.ENTITY_ITEM
}

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (code.consts.includes('pig')) {
    info.data.entities = {}
    const flat = code.consts.includes('falling_block')
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[A-Za-z_\d]+$/.test(line.const) || typeof line.previous.const === 'string') continue
      let name = toUpperCamelCase(line.const)
      if (name === 'VillagerGolem') name = 'IronGolem'
      if (name === 'Potion') name = 'ThrownPotion'
      if (name === 'ThrownEnderpearl') name = 'EnderPearl'
      const fieldName = (flat ? line.const : toUnderScoreCase(line.const)).toUpperCase()
      clsInfo.fields[line.nextOp('putstatic').field.fieldName].name = fieldName
      let entClassName = flat ? line.next.const : line.previous.const
      if (!entClassName) {
        const indy = line.nextOp('invokedynamic')
        if (indy) {
          const constrRef = indy.invokeDynamic.bootstrapMethod.args[1].ref
          if (constrRef.nameAndType.name === '<init>') entClassName = constrRef.class
        }
      }
      const pkg = name in ENTITY_PKG ? ENTITY_PKG[name] : PKG.ENTITY
      const entInfo = info.data.entities[line.const] = { name }
      if (entClassName) {
        const entClass = info.class[entClassName]
        entClass.name = pkg + '.' + name + 'Entity'
        entInfo.class = entClass
      }
      info.data.entities[line.const] = entInfo
    }
  }
  const { sig } = methodInfo
  if (sig.startsWith('(Ljava/lang/String;II)L')) return 'registerSpawnEgg'
  if (sig === '(Ljava/lang/Class;Ljava/lang/String;I)V') return 'registerEntity'
  if (s`(Ljava/lang/String;${CLASS.ENTITIES$BUILDER})${CLASS.ENTITIES}`.matches(methodInfo)) return 'registerEntity'
  if (s`(${CLASS.WORLD}${CLASS.ENTITY})`.matches(methodInfo)) return 'create'
  // TODO: matches register
  // if (sig.startsWith('(Ljava/lang/String;L') && methodInfo.flags.static) return 'createEntity'
  for (const c of code.consts) {
    if (typeof c === 'string' && c.startsWith('Skipping Entity with id ')) {
      if (!sig.startsWith('(IL') && methodInfo.argSigs.length >= 2) {
        info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.NBT_COMPOUND
        info.class[methodInfo.argSigs[1].slice(1, -1)].name = CLASS.WORLD
      }
      return 'create'
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Map;': return fieldInfo.flags.public ? 'SPAWN_EGGS' : undefined
    case 'Ljava/lang/Class;': return 'entityClass'
    case 'Ljava/util/function/Function;': return 'constructor'
  }
}
