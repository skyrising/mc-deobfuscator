// @flow
import * as PKG from '../PackageNames'
import * as CLASS from '../ClassNames'
import {hasSuperClass, doesImplement, getDefaultName} from '../util'

export const name = 'hierarchy'
export const generic = true

const PACKAGE_MAP = {
  [CLASS.BLOCK]: PKG.BLOCK,
  [CLASS.ITEM]: PKG.ITEM,
  [CLASS.ENTITY]: PKG.ENTITY,
  [CLASS.ENCHANTMENT]: PKG.ENCHANTMENT,
  [CLASS.BIOME]: PKG.BIOME,
  [CLASS.FLUID]: PKG.FLUID,
  [CLASS.GUI]: PKG.GUI,
  [CLASS.RENDER_ENTITY]: PKG.RENDER_ENTITY,
  [CLASS.PACKET]: PKG.NETWORK,
  [CLASS.BLOCK_ENTITY]: PKG.BLOCK_ENTITY,
  [CLASS.ABSTRACT_CLIENT_PLAYER]: PKG.CLIENT_ENTITY,
  [CLASS.GEN_LAYER]: PKG.WORLD_GEN_LAYER,
  [CLASS.DATA_PROVIDER]: PKG.DATA,
  [CLASS.ADVANCEMENT_TRIGGER]: PKG.ADVANCEMENT_TRIGGERS
}

const OBF_PACKAGE_MAP = {}

type SCInfo = {
  superClass?: string;
  interfaces?: Array<string> | Array<Array<string>>;
}

const SUPERCLASS_MAP: {[string]: string | SCInfo} = {
  [CLASS.HOPPER]: CLASS.CONTAINER_BLOCK,
  [CLASS.CONTAINER_BLOCK]: {interfaces: [CLASS.BLOCK_ENTITY_PROVIDER]},
  [CLASS.SAND]: CLASS.GRAVITY_BLOCK,
  [CLASS.BLOCK_STATE]: {interfaces: [CLASS.BLOCK_BEHAVIORS, CLASS.BLOCK_PROPERTY_CONTAINER]},
  [CLASS.BLOCK]: {interfaces: [CLASS.ITEMIZABLE]},
  [CLASS.PISTON]: CLASS.DIRECTIONAL_BLOCK,
  [CLASS.IRON_GOLEM]: CLASS.ENTITY_GOLEM,
  [CLASS.BLOCK_POS]: CLASS.VEC_3I,
  [CLASS.ALPHA_CHUNK_LOADER]: {interfaces: [CLASS.CHUNK_LOADER]},
  [CLASS.VILLAGE_COLLECTION]: CLASS.WORLD_SAVE_DATA,
  [CLASS.WORLD]: {interfaces: [CLASS.WORLD_STATE]},
  [CLASS.STANDING_BANNER]: CLASS.BANNER,
  [CLASS.NORMAL_HEAD]: CLASS.HEAD,
  [CLASS.STANDING_SIGN]: CLASS.SIGN,
  [CLASS.GHAST]: CLASS.FLYING,
  [CLASS.THROWN_ENDER_PEARL]: CLASS.ENTITY_ABSTRACT_PROJECTILE
}

export function init (info: FullInfo) {
  info.on('class-name', ({obf, deobf, clsInfo}: {obf: string, deobf: string, clsInfo: ClassInfo}) => {
    if (deobf in PACKAGE_MAP && !(obf in PACKAGE_MAP)) {
      OBF_PACKAGE_MAP[obf] = PACKAGE_MAP[deobf]
      console.log('Got package base class ' + deobf)
    }
    if (deobf in SUPERCLASS_MAP) {
      let scInfo: string | SCInfo = SUPERCLASS_MAP[deobf]
      if (typeof scInfo === 'string') scInfo = {superClass: scInfo}
      if (scInfo.interfaces && Array.isArray(scInfo.interfaces)) {
        scInfo.interfaces = ({[scInfo.interfaces.length]: scInfo.interfaces}: any)
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

export function cls (clsInfo: ClassInfo) {
  if (clsInfo.name) return
  const {info, bin: cls} = clsInfo
  clsInfo.done = false
  for (const scObfName in OBF_PACKAGE_MAP) {
    const scInfo = info.class[scObfName]
    if (scInfo.isInterface ? doesImplement(cls, scObfName) : hasSuperClass(cls, scObfName)) {
      clsInfo.package = OBF_PACKAGE_MAP[scObfName]
      console.debug('Packaged: ' + clsInfo.obfName + ' -> ' + clsInfo.package)
      postPackageSubclass(clsInfo, scInfo)
      break
    }
  }
  const NBTBase = info.classReverse[CLASS.NBT_BASE]
  if (NBTBase && (hasSuperClass(cls, NBTBase) || doesImplement(cls, NBTBase))) {
    if (cls.isAbstract()) return CLASS.NBT_PRIMITIVE
    clsInfo.package = PKG.NBT
    return
  }
  if (hasSuperClass(cls, 'com.mojang.datafixers.DataFix')) return PKG.DATAFIX + '.' + getDefaultName(clsInfo)
  if (hasSuperClass(cls, 'com.mojang.datafixers.schemas.Schema')) return PKG.DATAFIX_SCHEMAS + '.' + getDefaultName(clsInfo)
  if (clsInfo.isInnerClass) {
    if (clsInfo.outerClassName === info.classReverse[CLASS.PROFILER]) return 'Result'
    if (clsInfo.outerClassName === info.classReverse[CLASS.BLOCK_POS] && hasSuperClass(cls, info.classReverse[CLASS.BLOCK_POS])) {
      return cls.getSuperclassName() === info.classReverse[CLASS.BLOCK_POS]
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
