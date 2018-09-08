// @flow
import { toUpperCamelCase } from '../../../../util'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    info.data.items = {}
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      if (!/^[a-z_\d]+$/.test(line.const)) continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      info.data.items[name] = {}
      clsInfo.fields[putstatic.field.fieldName].name = name.toUpperCase()
      if (putstatic.previous.op === 'checkcast') {
        const castTo = putstatic.previous.arg.slice(1, -1)
        if (info.class[castTo].name && info.class[castTo].name.indexOf('Item') >= 0) continue
        const ucc = ({
          LeatherHelmet: 'Armor'
        })[toUpperCamelCase(name)] || toUpperCamelCase(name)
        info.class[castTo].name = 'net.minecraft.item.Item' + ucc
        info.data.items[name] = info.class[castTo].name
      }
    }
  }
}
