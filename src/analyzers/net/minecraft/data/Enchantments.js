// @flow

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    info.data.enchantments = {}
    for (const line of code.lines) {
      if (typeof (line: any).const !== 'string') continue
      const name: string = ((line: any).const: any)
      if (!/^[a-z_\d]+$/.test(name)) continue
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.fields[putstatic.field.fieldName].name = name.toUpperCase()
      info.data.enchantments[name] = {}
    }
  }
}
