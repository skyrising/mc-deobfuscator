
export function field (fieldInfo) {
  const {sig} = fieldInfo
  switch (sig) {
    case 'Ljava/util/Set;': return 'REGISTERED'
  }
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (methodInfo.origName === '<clinit>') {
    const setData = !('potions' in info.data)
    if (setData) info.data.potions = {}
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.field[putstatic.field.fieldName] = name.toUpperCase()
      if (setData) info.data.potions[name] = {}
    }
  }
}
