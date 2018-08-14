// import * as CLASS from '../../../../ClassNames'

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  if (sig === '[L' + clsInfo.obfName + ';') return 'WORLD_TYPES'
}

export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (methodInfo.origName === '<clinit>') {
    for (const line of code.lines) {
      if (typeof line.const !== 'string') continue
      const name = line.const
      const putstatic = line.nextOp('putstatic')
      if (!putstatic) continue
      clsInfo.field[putstatic.field.fieldName] = ({
        largeBiomes: 'LARGE_BIOMES',
        'debug_all_block_states': 'DEBUG'
      })[name] || name.toUpperCase()
    }
    return
  }
  const {sig} = methodInfo
  const self = clsInfo.obfName
  switch (sig) {
    case '(Ljava/lang/String;)L' + self + ';': return 'fromName'
    case '(I)L' + self + ';': return 'withVersion'
    case '()Ljava/lang/String;': return code.consts.includes('.info') ? 'getInfo' : 'getName'
  }
}
