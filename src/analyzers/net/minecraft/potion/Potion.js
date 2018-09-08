// @flow
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.sig === '()V' && code.consts.includes('awkward')) {
    const MobEffect = info.classReverse[CLASS.MOB_EFFECT]
    const MobEffects = info.classReverse[CLASS.MOB_EFFECTS]
    if (!MobEffect || !MobEffects) {
      clsInfo.done = false
      return
    }
    info.data.potions = info.data.potions || {}
    for (const line of code.lines) {
      if (line.op === 'new') {
        const name = line.previous && line.previous.const
        if (typeof name !== 'string') continue
        console.debug('potion name %o', name)
        const potion = {}
        let nextConst = line.nextMatching(l => l.const !== undefined)
        if (!nextConst) continue
        if (typeof nextConst.const === 'string') {
          potion.base = nextConst.const
          nextConst = nextConst.nextMatching(l => l.const !== undefined)
          if (!nextConst) continue
        }
        const numEffects = nextConst.const
        console.debug('potion %o numEffects %o', potion, nextConst)
        if (typeof numEffects !== 'number') continue
        const newArray = nextConst.nextOp('anewarray')
        console.debug('potion %o', newArray)
        if (!newArray) continue
        potion.effects = []
        let currentEffect = {}
        for (let current = newArray; potion.effects.length < numEffects && current; current = current.next) {
          if (current.op === 'getstatic' && current.field.className === MobEffects) {
            currentEffect.id = info.class[MobEffects].fields[current.field.fieldName].name.toLowerCase()
          } else if (typeof current.const === 'number' && currentEffect.id && !('duration' in currentEffect)) {
            currentEffect.duration = current.const
          } else if (typeof current.const === 'number' && currentEffect.id) {
            currentEffect.amplifier = current.const
          } else if (current.op === 'aastore') {
            potion.effects.push(currentEffect)
            currentEffect = {}
          }
          console.debug('potion %s %o %o %o', name, currentEffect, current, potion)
        }
        info.data.potions[name] = potion
      }
    }
    return 'init'
  }
}
