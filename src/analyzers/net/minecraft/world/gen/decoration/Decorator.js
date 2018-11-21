// @flow
import * as PKG from '../../../../../../PackageNames'
import * as CLASS from '../../../../../../ClassNames'
import { registryMethod } from '../../../../../sharedLogic'
import { toUpperCamelCase, commonWords } from '../../../../../../util'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'decorators', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const newDecorator = line.next
      if (!newDecorator || newDecorator.op !== 'new') return
      const { className } = ((newDecorator: any): CodeLineNew)
      const decoratorClass = info.class[className]
      decoratorClass.name = PKG.WORLD_GEN_DECORATION + '.' + toUpperCamelCase(id)
      return {
        class: decoratorClass,
        config: info.class[field.genericSignature.simple[0].typeArguments.value[0].value.simple[0].identifier]
      }
    },
    post (data: {[string]: Object}) {
      const configs = {}
      for (const id in data) {
        const confClsName = data[id].config.obfName
        if (!configs[confClsName]) configs[confClsName] = []
        configs[confClsName].push(id)
      }
      for (const obfName in configs) {
        const cs = configs[obfName]
        let prefix = commonWords(cs.map(id => id.split('_')), 0.6).join('_')
        const configCls = info.class[obfName]
        if (cs.includes('nope')) {
          info.class[configCls.interfaceNames[0]].name = CLASS.WORLD_GEN_DECORATOR_CONFIG
          prefix = 'Empty'
        }
        if (prefix) configCls.name = PKG.WORLD_GEN_DECORATION_CONFIG + '.' + toUpperCamelCase(prefix) + 'Config'
        else configCls.class[obfName].package = PKG.WORLD_GEN_DECORATION_CONFIG
        for (const method of Object.values(configCls.method)) {
          if (method.sig !== `(Lcom/mojang/datafixers/Dynamic;)L${obfName};` || !method.flags.static) continue
          
        }
      }
    }
  })
}
