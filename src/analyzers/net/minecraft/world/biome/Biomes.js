// @flow
import * as PKG from '../../../../../PackageNames'
import * as CLASS from '../../../../../ClassNames'
import { registryMethod } from '../../../../sharedLogic'
import { toUpperCamelCase, getMappedClassName, dot } from '../../../../../util'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'biomes', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const newBiome = line.next
      if (!newBiome || newBiome.op !== 'new') return
      const { className } = ((newBiome: any): CodeLineNew)
      const biomeClass = info.class[className]
      biomeClass.name = PKG.BIOME + '.' + toUpperCamelCase(id) + 'Biome'
      const numId = (line.prev && line.prev.constant && line.prev.constant.value) || undefined
      const biomeInfo = { class: biomeClass, id: numId }
      try {
        console.error(`Biome interp(${id})`)
        const interp = biomeClass.method['<init>:()V'].interpreter()
        const invoke = (interp, call) => {
          const { args } = call
          if (args.length > 1 && args[1].constructor.name === 'ObjectMember' && !args[1].obj) {
            const className = args[1].objClass
            const cls = info.class[className]
            const field = cls.fields[args[1].member]
            const props = {
              [CLASS.SURFACE_BUILDER]: 'surfaceBuilder',
              [CLASS.BIOME$PRECIPITATION]: 'precipitation',
              [CLASS.BIOME$CATEGORY]: 'category'
            }
            const mapped = dot(getMappedClassName(cls))
            const prop = props[mapped]
            if (prop) {
              biomeInfo[prop] = field
              console.error(prop, field)
            }
          }
          if (args.length === 3 && args[2].type === info.classReverse[CLASS.BIOME$SPAWN_LIST_ENTRY]) {
            if (!biomeInfo.spawnable) biomeInfo.spawnable = {}
            const category = info.class[args[1].objClass].field[args[1].member].bestName.toLowerCase()
            if (!biomeInfo.spawnable[category]) biomeInfo.spawnable[category] = []
            biomeInfo.spawnable[category].push(args[2])
          }
          if (call.name === '<init>') {
            const self = call.args[0]
            const cls = info.class[self.type]
            const mapped = dot(getMappedClassName(cls))
            switch (mapped) {
              case CLASS.BIOME$SPAWN_LIST_ENTRY: {
                const [, type, weight, minPackSize, maxPackSize] = call.args
                self.fields = { type, weight, minPackSize, maxPackSize }
                console.error(self)
                break
              }
            }
          }
          // console.error(biomeInfo, call.type, call.name, call.args.map(arg => arg.deobfuscate(info)))
          console.error(biomeInfo, call.deobfuscate(info))
        }
        interp.handlers['invokespecial'] = invoke
        interp.handlers['invokevirtual'] = invoke
        interp.run()
      } catch (e) {
        console.error(`Biome interp(${id}): ${e.stack}`)
      }
      return biomeInfo
    }
  })
}
