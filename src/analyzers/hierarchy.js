// @flow
import * as PKG from '../PackageNames'
import * as CLASS from '../ClassNames'
import { hasSuperClass, doesAnyImplement, getDefaultName, getBaseInterfaces } from '../util'

export const name = 'hierarchy'
export const generic = true

const PACKAGE_MAP = {
  [CLASS.BLOCK]: PKG.BLOCK,
  [CLASS.ITEM]: PKG.ITEM,
  [CLASS.ENTITY]: PKG.ENTITY,
  [CLASS.ENCHANTMENT]: PKG.ENCHANTMENT,
  [CLASS.BIOME]: PKG.BIOME,
  [CLASS.FLUID]: PKG.FLUID,
  [CLASS.GUI_SCREEN]: PKG.MENU,
  [CLASS.GUI]: PKG.GUI,
  [CLASS.RENDER_ENTITY]: PKG.RENDER_ENTITY,
  [CLASS.PACKET]: PKG.NETWORK,
  [CLASS.BLOCK_ENTITY]: PKG.BLOCK_ENTITY,
  [CLASS.ABSTRACT_CLIENT_PLAYER]: PKG.CLIENT_ENTITY,
  [CLASS.GEN_LAYER]: PKG.WORLD_GEN_LAYER,
  [CLASS.DATA_PROVIDER]: PKG.DATA,
  [CLASS.ADVANCEMENT_TRIGGER]: PKG.ADVANCEMENT_TRIGGERS,
  [CLASS.AI_GOAL]: PKG.ENTITY_AI,
  [CLASS.PARTICLE]: PKG.PARTICLE,
  [CLASS.REGISTRY]: PKG.REGISTRY,
  [CLASS.CARVER]: PKG.WORLD_GEN_CARVING,
  [CLASS.DECORATOR]: PKG.WORLD_GEN_DECORATION,
  [CLASS.FEATURE]: PKG.WORLD_GEN_FEATURE,
  [CLASS.SURFACE_BUILDER]: PKG.WORLD_GEN_SURFACE
}

const OBF_PACKAGE_MAP = {
  'com.mojang.datafixers.DataFix': PKG.DATAFIX,
  'com.mojang.datafixers.schemas.Schema': PKG.DATAFIX_SCHEMAS
}

type SCInfo = {
  superClass?: string;
  interfaces?: Array<string> | Array<Array<string>>;
}

const SUPERCLASS_MAP: {[string]: string | SCInfo} = {
  [CLASS.HOPPER]: CLASS.CONTAINER_BLOCK,
  [CLASS.CONTAINER_BLOCK]: { interfaces: [CLASS.BLOCK_ENTITY_PROVIDER] },
  [CLASS.SAND]: CLASS.GRAVITY_BLOCK,
  [CLASS.BLOCK_STATE]: { interfaces: [CLASS.BLOCK_BEHAVIORS, CLASS.BLOCK_PROPERTY_CONTAINER] },
  [CLASS.BLOCK]: { interfaces: [CLASS.ITEMIZABLE] },
  [CLASS.PISTON]: CLASS.DIRECTIONAL_BLOCK,
  [CLASS.IRON_GOLEM]: CLASS.ENTITY_GOLEM,
  [CLASS.BLOCK_POS]: CLASS.VEC_3I,
  [CLASS.ALPHA_CHUNK_LOADER]: { interfaces: [CLASS.CHUNK_LOADER] },
  [CLASS.VILLAGE_COLLECTION]: CLASS.WORLD_SAVE_DATA,
  [CLASS.WORLD]: { interfaces: [CLASS.WORLD_STATE] },
  [CLASS.STANDING_BANNER]: CLASS.BANNER,
  [CLASS.NORMAL_HEAD]: CLASS.HEAD,
  [CLASS.STANDING_SIGN]: CLASS.SIGN,
  [CLASS.GHAST]: CLASS.FLYING,
  [CLASS.THROWN_ENDER_PEARL]: CLASS.ENTITY_ABSTRACT_PROJECTILE,
  [CLASS.DEFAULTED_MAPPED_REGISTRY]: CLASS.SIMPLE_REGISTRY
}

export function init (info: FullInfo) {
  info.on('class-name', ({ obf, deobf, clsInfo }: {obf: string, deobf: string, clsInfo: ClassInfo}) => {
    switch (deobf) {
      case CLASS.GEN_LAYER_HILLS: {
        const baseInterfaces = getBaseInterfaces(clsInfo)
        if (baseInterfaces.length !== 1) {
          console.warn('Expected only one base interface for GenLayerHills, got: %s', baseInterfaces)
        }
        for (const bi of baseInterfaces) {
          if (!(bi in info.class)) continue
          info.class[bi].package = PKG.WORLD_GEN_LAYER
          OBF_PACKAGE_MAP[bi] = PKG.WORLD_GEN_LAYER
        }
        break
      }
    }
    if (deobf in PACKAGE_MAP && !(obf in PACKAGE_MAP)) {
      OBF_PACKAGE_MAP[obf] = PACKAGE_MAP[deobf]
      console.log('Got package base class ' + deobf)
    }
    if (deobf in SUPERCLASS_MAP) {
      let scInfo: string | SCInfo = SUPERCLASS_MAP[deobf]
      if (typeof scInfo === 'string') scInfo = { superClass: scInfo }
      if (scInfo.interfaces && Array.isArray(scInfo.interfaces)) {
        scInfo.interfaces = ({ [scInfo.interfaces.length]: scInfo.interfaces }: any)
      }
      if (scInfo.superClass) {
        const scn = clsInfo.superClassName
        if (scn && !scn.startsWith('java.')) {
          console.debug('Naming superclass of %s (%s): %s (%s)', deobf, obf, scInfo.superClass, scn)
          info.class[scn].name = scInfo.superClass
        }
      }
      if (scInfo.interfaces && clsInfo.interfaceNames.length in scInfo.interfaces) {
        const ifn = scInfo.interfaces[clsInfo.interfaceNames.length]
        for (let i = 0; i < ifn.length; i++) {
          console.debug('Naming interface of %s (%s): %s (%s)', deobf, obf, ifn[i], clsInfo.interfaceNames[i])
          info.class[clsInfo.interfaceNames[i]].name = ifn[i]
        }
      } else if (scInfo.interfaces) {
        console.log('Unknown interface count %d for %s', clsInfo.interfaceNames.length, deobf)
      }
    }
  })
}

function isInterface (scInfo: ClassInfo) {
  if (scInfo && scInfo.flags) return scInfo.flags.interface
  switch (scInfo.obfName) {
    case 'com.mojang.datafixers.DataFix': return false
    case 'com.mojang.datafixers.schemas.Schema': return false
  }
  return false
}

export function cls (clsInfo: ClassInfo) {
  if (clsInfo.name) return
  const { info } = clsInfo
  clsInfo.done = false
  for (const scObfName in OBF_PACKAGE_MAP) {
    const scInfo = info.class[scObfName]
    const doesExtend = isInterface(scInfo)
      ? doesAnyImplement(clsInfo, scObfName)
      : hasSuperClass(clsInfo, scObfName)
    console.debug('does %s extend %s: %o', clsInfo.obfName, scObfName, doesExtend)
    if (doesExtend) {
      clsInfo.package = OBF_PACKAGE_MAP[scObfName]
      console.debug('Packaged: ' + clsInfo.obfName + ' -> ' + clsInfo.package)
      postPackageSubclass(clsInfo, scInfo)
      break
    }
  }
  const NBTBase = info.classReverse[CLASS.NBT_BASE]
  if (NBTBase && (hasSuperClass(clsInfo, NBTBase) || doesAnyImplement(clsInfo, NBTBase))) {
    if (clsInfo.flags.abstract) return CLASS.NBT_PRIMITIVE
    clsInfo.package = PKG.NBT
    return
  }
  // XXX: Other types too?
  if (doesAnyImplement(clsInfo, 'java.lang.Comparable')) {
    for (const md of ((Object.values(clsInfo.method): any): Array<MethodInfo>)) {
      if (md.origName !== 'compareTo') continue
      if (!md.flags.synthetic) continue
      const call = md.code.calls[0]
      if (!call) continue
      clsInfo.method[call.methodName + ':' + call.signature].name = 'compareTo'
    }
  }
  if (clsInfo.isInnerClass) {
    if (clsInfo.outerClassName === info.classReverse[CLASS.PROFILER]) return 'Result'
    if (clsInfo.outerClassName === info.classReverse[CLASS.BLOCK_POS] && hasSuperClass(clsInfo, info.classReverse[CLASS.BLOCK_POS])) {
      return clsInfo.superClassName === info.classReverse[CLASS.BLOCK_POS]
        ? CLASS.BLOCK_POS$MUTABLE_BLOCK_POS
        : CLASS.BLOCK_POS$POOLED_MUTABLE_BLOCK_POS
    }
  }
}

function postPackageSubclass (clsInfo, scInfo) {
  if (scInfo.name === CLASS.PACKET) return processPacket(clsInfo, scInfo)
}

function processPacket (clsInfo, scInfo) {
  if (!clsInfo.attributes.Signature) {
    console.warn('No signature: %s', clsInfo.obfName)
    return
  }
  const handler = clsInfo.genericSignature.superInterfaceSignatures[0].simple[0].typeArguments.value[0].value.simple[0].identifier
  const fields = Object.values(clsInfo.fields).map(fieldInfo => fieldInfo.signature)
  console.debug('packet %s, handler %s, fields %o', clsInfo.obfName, handler, fields)
}
