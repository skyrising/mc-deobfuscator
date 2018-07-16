import * as generic from '../../../generic'

export function cls (cls, clsInfo, info) {
  info.class[cls.getSuperclassName()].name = 'net.minecraft.world.World'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  generic.method(cls, method, code, methodInfo, clsInfo, info)
}
