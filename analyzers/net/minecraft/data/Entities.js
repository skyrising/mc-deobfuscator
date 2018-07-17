import * as CLASS from '../../../../ClassNames'
import * as PKG from '../../../../PackageNames'

const ENTITY_PKG = {
  Arrow: PKG.ENTITY_PROJECTILE,
  Bat: PKG.ENTITY_PASSIVE,
  Blaze: PKG.ENTITY_MONSTER,
  Boat: PKG.ENTITY_ITEM,
  CaveSpider: PKG.ENTITY_MONSTER,
  Chicken: PKG.ENTITY_PASSIVE,
  Cow: PKG.ENTITY_PASSIVE,
  Creeper: PKG.ENTITY_MONSTER,
  Donkey: PKG.ENTITY_PASSIVE,
  DragonFireball: PKG.ENTITY_PROJECTILE,
  ElderGuardian: PKG.ENTITY_MONSTER,
  EnderCrystal: PKG.ENTITY_ITEM,
  EnderDragon: PKG.ENTITY_BOSS,
  Enderman: PKG.ENTITY_MONSTER,
  Endermite: PKG.ENTITY_MONSTER,
  EvocationFangs: PKG.ENTITY_PROJECTILE,
  EvocationIllager: PKG.ENTITY_MONSTER,
  EyeOfEnderSignal: PKG.ENTITY_ITEM,
  FallingSand: PKG.ENTITY_ITEM,
  Fireball: PKG.ENTITY_PROJECTILE,
  FireworksRocketEntity: PKG.ENTITY_PROJECTILE,
  Ghast: PKG.ENTITY_MONSTER,
  Giant: PKG.ENTITY_MONSTER,
  Guardian: PKG.ENTITY_MONSTER,
  Horse: PKG.ENTITY_PASSIVE,
  Husk: PKG.ENTITY_MONSTER,
  IllusionIllager: PKG.ENTITY_MONSTER,
  Item: PKG.ENTITY_ITEM,
  ItemFrame: PKG.ENTITY_ITEM,
  LavaSlime: PKG.ENTITY_MONSTER,
  LeashKnot: PKG.ENTITY_ITEM,
  Llama: PKG.ENTITY_PASSIVE,
  LlamaSpit: PKG.ENTITY_PROJECTILE,
  Mule: PKG.ENTITY_PASSIVE,
  MushroomCow: PKG.ENTITY_PASSIVE,
  Ozelot: PKG.ENTITY_PASSIVE,
  Parrot: PKG.ENTITY_PASSIVE,
  Painting: PKG.ENTITY_ITEM,
  Pig: PKG.ENTITY_PASSIVE,
  PigZombie: PKG.ENTITY_MONSTER,
  PolarBear: PKG.ENTITY_MONSTER,
  PrimedTnt: PKG.ENTITY_ITEM,
  Rabbit: PKG.ENTITY_PASSIVE,
  Sheep: PKG.ENTITY_PASSIVE,
  Shulker: PKG.ENTITY_MONSTER,
  ShulkerBullet: PKG.ENTITY_PROJECTILE,
  Silverfish: PKG.ENTITY_MONSTER,
  Skeleton: PKG.ENTITY_MONSTER,
  SkeletonHorse: PKG.ENTITY_PASSIVE,
  Slime: PKG.ENTITY_MONSTER,
  SmallFireball: PKG.ENTITY_PROJECTILE,
  Snowball: PKG.ENTITY_PROJECTILE,
  SnowMan: PKG.ENTITY_PASSIVE,
  SpectralArrow: PKG.ENTITY_PROJECTILE,
  Spider: PKG.ENTITY_MONSTER,
  Squid: PKG.ENTITY_PASSIVE,
  Stray: PKG.ENTITY_MONSTER,
  ThrownEgg: PKG.ENTITY_PROJECTILE,
  ThrownEnderpearl: PKG.ENTITY_PROJECTILE,
  ThrownExpBottle: PKG.ENTITY_PROJECTILE,
  ThrownPotion: PKG.ENTITY_PROJECTILE,
  Vex: PKG.ENTITY_MONSTER,
  Villager: PKG.ENTITY_PASSIVE,
  VillagerGolem: PKG.ENTITY_PASSIVE,
  VindicationIllager: PKG.ENTITY_MONSTER,
  Witch: PKG.ENTITY_MONSTER,
  WitherBoss: PKG.ENTITY_BOSS,
  WitherSkeleton: PKG.ENTITY_MONSTER,
  WitherSkull: PKG.ENTITY_ITEM,
  Wolf: PKG.ENTITY_PASSIVE,
  Zombie: PKG.ENTITY_MONSTER,
  ZombieHorse: PKG.ENTITY_PASSIVE,
  ZombieVillager: PKG.ENTITY_MONSTER,
  XPOrb: PKG.ENTITY_ITEM
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (code.consts.includes('pig')) {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[A-Z][A-Za-z_\d]+$/.test(line.const)) continue
      const name = line.const
      const entClass = line.previous.const
      const pkg = name in ENTITY_PKG ? ENTITY_PKG[name] : PKG.ENTITY
      info.class[entClass].name = pkg + '.' + name
    }
  }
  const sig = method.getSignature()
  for (const c of code.consts) {
    if (typeof c === 'string' && c.startsWith('Skipping Entity with id ')) {
      if (!sig.startsWith('(IL')) {
        const args = method.getArgumentTypes()
        info.class[args[0].getClassName()].name = CLASS.NBT_COMPOUND
        info.class[args[1].getClassName()].name = CLASS.WORLD
      }
      return 'createEntity'
    }
  }
  if (sig.startsWith('(Ljava/lang/String;II)L')) return 'registerSpawnEgg'
  if (sig === '(Ljava/lang/Class;Ljava/lang/String;I)V') return 'registerEntity'
  if (sig.startsWith('(Ljava/lang/String;L') && method.isStatic()) return 'createEntity'
}

export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Map;': return field.isPublic() ? 'SPAWN_EGGS' : undefined
  }
}
