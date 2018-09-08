// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/Set;': return 'REGISTERED'
  }
}

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    const setData = !('potions' in info.data)
    if (setData) info.data.potions = {}
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.fields[putstatic.field.fieldName].name = name.toUpperCase()
      if (setData) info.data.potions[name] = {}
    }
  }
}
