// @flow
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const {code, clsInfo, info} = methodInfo
  if (methodInfo.origName === '<clinit>') {
    info.data.fluids = {
      post () {
        for (const data of Object.values(this)) {
          data.class = info.class[data.class].name || data.class
        }
      }
    }
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_.\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.fields[putstatic.field.fieldName].name = name.replace(/\./g, '_').toUpperCase()
      info.data.fluids[name] = {class: putstatic.field.type.slice(1, -1)}
      if (name === 'flowing_water') info.class[putstatic.field.type.slice(1, -1)].name = CLASS.NON_EMPTY_FLUID
    }
  }
}
