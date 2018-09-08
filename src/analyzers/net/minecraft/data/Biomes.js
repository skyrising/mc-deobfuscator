// @flow

export function method (methodInfo: MethodInfo) {
  const {code, clsInfo, info} = methodInfo
  if (methodInfo.origName === '<clinit>') {
    info.data.biomes = {}
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.fields[putstatic.field.fieldName].name = name.toUpperCase()
      info.data.biomes[name] = {}
    }
  }
}
