// @flow
import { toUpperCamelCase } from '../../../../util'
import { registerBlocks } from '../../../sharedLogic'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') {
    if (code.consts.includes('polished_granite_stairs')) registerBlocks(methodInfo)
    for (const line of code.lines) {
      if (typeof (line: any).const !== 'string') continue
      const name: string = ((line: any).const: any)
      if (!/^[a-z_\d]+$/.test(name)) continue
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.fields[putstatic.field.fieldName].name = name.toUpperCase()
      if (putstatic.previous && putstatic.previous.op === 'checkcast') {
        const castTo = putstatic.previous.arg.slice(1, -1)
        if (info.class[castTo].name && info.class[castTo].name.indexOf('Block') >= 0) continue
        const ucc = ({
          FlowingWater: 'Flowing',
          Water: 'Liquid',
          UnpoweredRepeater: 'Repeater',
          UnpoweredComparator: 'Comparator',
          YellowFlower: 'Flower',
          StickyPiston: 'Piston',
          WoodenDoor: 'Door'
        })[toUpperCamelCase(name)] || toUpperCamelCase(name)
        info.class[castTo].name = 'net.minecraft.block.Block' + ucc
      }
    }
  }
}
