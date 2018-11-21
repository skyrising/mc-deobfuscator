// @flow
import * as PKG from '../../../../PackageNames'
import * as CLASS from '../../../../ClassNames'
import { registryMethod } from '../../../sharedLogic'
import { toUpperCamelCase, commonWords, getMappedClassName, dot } from '../../../../util'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  return registryMethod(methodInfo, 'enchantments', {
    eval (id: string, line: CodeLineLoadConst, field: FieldInfo) {
      const newEnchantment = line.next
      if (!newEnchantment || newEnchantment.op !== 'new') return
      const { className } = ((newEnchantment: any): CodeLineNew)
      const data: Object = {
        class: info.class[className]
      }
      const getstatic = line.nextOp('getstatic')
      if (getstatic) {
        const enumClass = info.class[getstatic.field.fullClassName]
        if (dot(getMappedClassName(enumClass)) === CLASS.ENCHANTMENT$RARITY) data.rarity = enumClass.fields[getstatic.field.fieldName]
      }
      return data
    },
    post (data: {[string]: Object}) {
      const enchOfType = {}
      for (const id in data) {
        const cls = data[id].class.obfName
        if (!enchOfType[cls]) enchOfType[cls] = []
        enchOfType[cls].push(id)
      }
      for (const obfName in enchOfType) {
        const ids = enchOfType[obfName]
        const cls = info.class[obfName]
        let name = commonWords(ids.map(id => id.split('_')), 0.6).join('_')
        if (!name) {
          if (ids.includes('looting')) name = 'loot_bonus'
          else if (ids.includes('sharpness')) name = 'damage_bonus'
        }
        if (name) cls.name = PKG.ENCHANTMENT + '.' + toUpperCamelCase(name)
        for (const md of ((Object.values(cls.method): any): Array<MethodInfo>)) {
          if (md.sig !== '(I)I' && md.sig !== '()I') continue
          try {
            const interp = md.interpreter()
            interp.lvt = ['this', 'level']
            const val = interp.run()
            let key = md.obfName + md.sig
            if (md.name === 'getMinEnchantability') key = 'minEnchantability'
            else if (md.name === 'getMaxEnchantability') key = 'maxEnchantability'
            else if (md.sig === '()I') key = 'maxLevel'
            for (const id of ids) data[id][key] = val
          } catch (e) {
            console.warn(e)
          }
        }
      }
    }
  })
}
