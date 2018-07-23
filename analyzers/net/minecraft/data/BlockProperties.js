export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (methodInfo.origName === '<clinit>') {
    const count = {}
    for (const c of code.consts) count[c] = (count[c] || 0) + 1
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      const {fieldName} = putstatic.field
      switch (name) {
        case 'age': {
          const max = line.next.next.const
          if (max) clsInfo.field[fieldName] = 'AGE_' + max
          break
        }
        case 'level': {
          const from = line.next.const
          const to = line.next.next.const
          if (from === 1 && to === 8) clsInfo.field[fieldName] = 'WATER_LEVEL'
          else if (to) clsInfo.field[fieldName] = 'LEVEL_' + to
          break
        }
        default: {
          if (count[name] === 1) clsInfo.field[fieldName] = name.toUpperCase()
        }
      }
    }
  }
}
