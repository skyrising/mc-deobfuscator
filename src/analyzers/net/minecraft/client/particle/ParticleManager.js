// @flow
import * as PKG from '../../../../../PackageNames'
import * as CLASS from '../../../../../ClassNames'
import { toUpperCamelCase } from '../../../../../util'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.WORLD}`.matches(fieldInfo)) return 'world'
  if (s`${CLASS.RESOURCE_LOCATION}`.matches(fieldInfo)) return 'TEXTURE_LOCATION'
  switch (fieldInfo.sig) {
    case 'Ljava/util/Random;': return 'rand'
    case 'Ljava/util/Map;': case 'Lit/unimi/dsi/fastutil/ints/Int2ObjectMap;': {
      const { genericSignature } = fieldInfo
      const { typeArguments } = genericSignature.simple[0]
      const last = typeArguments.value[typeArguments.value.length - 1].value.simple[0]
      const lastName = (last.package ? last.package + '.' : '') + last.identifier
      fieldInfo.info.class[lastName].name = CLASS.PARTICLE_FACTORY
      console.debug('ParicleManager.%s: %o %o', fieldInfo.obfName, lastName)
    }
  }
}

const PARTICLE_CLASS_NAMES = {
  ANGRY_VILLAGER: 'RisingParticle$AngryVillagerFactory',
  AMBIENT_ENTITY_EFFECT: 'EffectParticle$AmbientEntityEffectFactory',
  CRIT: 'HitParticle$CriticalHitFactory',
  DAMAGE_INDICATOR: 'HitParticle$DamageIndicatorFactory',
  DOLPHIN: 'AuraParticle$DolphonFactory',
  DRIPPING_LAVA: 'DrippingFluidParticle$DrippingLavaFactory',
  DRIPPING_WATER: 'DrippingFluidParticle$DrippingWaterFactory',
  EFFECT: 'EffectParticle$EffectFactory',
  ENCHANT: 'NoCollisionParticle$EnchantFactory',
  ENCHANTED_HIT: 'HitParticle$EnchantedHitFactory',
  ENTITY_EFFECT: 'EffectParticle$EntityEffectFactory',
  HAPPY_VILLAGER: 'AuraParticle$HappyVillagerFactory',
  HEART: 'RisingParticle$HeartFactory',
  INSTANT_EFFECT: 'EffectParticle$InstantEffectFactory',
  ITEM: 'ItemParticle$ItemFactory',
  ITEM_SLIME: 'ItemParticle$SlimeFactory',
  ITEM_SNOWBALL: 'ItemParticle$SnowballFactory',
  MYCELIUM: 'AuraParticle$MyceliumFactory',
  NAUTILUS: 'NoCollisionParticle$NautilusFactory',
  WITCH: 'EffectParticle$WitchEffectFactory'
}

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  if (methodInfo.sig === '()V' && methodInfo.flags.private) {
    const { lines } = methodInfo.code
    const outputs = {}
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.op !== 'getstatic') continue
      const fieldName = info.class[line.field.fullClassName].fields[line.field.fieldName].name
      const simpleName = PARTICLE_CLASS_NAMES[fieldName] || (toUpperCamelCase(fieldName.toLowerCase()) + 'Particle$Factory')
      const name = PKG.PARTICLE + '.' + simpleName
      const newFactory = line.nextOp('new')
      if (!newFactory) break
      const innerClass = info.class[newFactory.className]
      const innerName = name
      console.debug('ParticleManager: %s %d', innerName, outputs[innerClass.outerClassName] || 0)
      if (!outputs[innerClass.outerClassName]) {
        innerClass.name = innerName
        outputs[innerClass.outerClassName] = 1
      } else if (fieldName in PARTICLE_CLASS_NAMES) {
        innerClass.name = innerName
      } else {
        innerClass.name = innerName + outputs[innerClass.outerClassName]++
      }
      const outerClass = info.class[innerClass.outerClassName]
      outerClass.name = name.slice(0, name.lastIndexOf('$'))
      i = lines.indexOf(newFactory, i)
    }
    return 'registerParticles'
  }
}
