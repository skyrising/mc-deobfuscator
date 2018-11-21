// @flow

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo } = methodInfo
  if (methodInfo.obfName === '<clinit>') {
    const count = {}
    for (const c of code.constants) {
      if (c.type !== 'string') continue
      count[c.value] = (count[c.value] || 0) + 1
    }
    for (const c of code.constants) {
      if (c.type !== 'string') continue
      const name = c.value
      if (!/^[a-z_\d]+$/.test(name)) continue
      const line = c.line
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      const { fieldName } = putstatic.field
      switch (name) {
        case 'age': {
          const max = line.next.next.const
          if (max) clsInfo.fields[fieldName].name = 'AGE_' + max
          break
        }
        case 'level': {
          const from = line.next.const
          const to = line.next.next.const
          if (from === 1 && to === 8) clsInfo.fields[fieldName].name = 'WATER_LEVEL'
          else if (from === 0 && to === 3) clsInfo.fields[fieldName].name = 'CAULDRON_LEVEL'
          else if (to) clsInfo.fields[fieldName].name = 'LEVEL_' + to
          break
        }
        case 'distance': {
          const from = line.next.const
          const to = line.next.next.const
          if (from === 1 && to === 7) clsInfo.fields[fieldName].name = 'LEAF_DISTANCE'
          else if (from === 0 && to === 5) clsInfo.fields[fieldName].name = 'SCAFFOLDING_DISTANCE'
          else clsInfo.fields[fieldName].name = 'DISTANCE_' + from + '_' + to
        }
        default: {
          if (count[name] === 1) clsInfo.fields[fieldName].name = name.toUpperCase()
        }
      }
    }
  }
}
