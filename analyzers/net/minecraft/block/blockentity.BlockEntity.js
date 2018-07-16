import {toUpperCamelCase} from '../../../../util'
import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (method.getName() === '<clinit>') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      const isOld = /^[A-Z][A-Za-z_\d]+$/.test(line.const)
      if (line.const.length < 4 && line.const !== 'bed' && !isOld) continue
      const isNew = /^[a-z_\d]+$/.test(line.const)
      if (!isOld && !isNew) continue
      const name = isNew ? toUpperCamelCase(line.const) : line.const
      const clsName = isOld ? line.previous.const : line.next.const
      if (!clsName) continue
      info.class[clsName].name = CLASS.BLOCK_ENTITY + name
      if (isNew && line.next.next.call) info.method[line.next.next.call.fullSig].name = 'registerBlockEntity'
    }
  }
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  const Block = info.classReverse[CLASS.BLOCK]
  const World = info.classReverse[CLASS.WORLD]
  const BlockPos = info.classReverse[CLASS.BLOCK_POS]
  if (!Block || !World || !BlockPos) clsInfo.done = false
  if (Block && sig === 'L' + Block + ';') return 'block'
  if (World && sig === 'L' + World + ';') return 'world'
  if (BlockPos && sig === 'L' + BlockPos + ';') return 'pos'
}
