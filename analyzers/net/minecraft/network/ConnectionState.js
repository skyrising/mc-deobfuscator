import * as CLASS from '../../../../ClassNames'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  if (methodInfo.origName === '<clinit>') return clinit(methodInfo)
  if (sig.endsWith(')Ljava/lang/Integer;')) {
    info.class[methodInfo.args[1].getClassName()].name = CLASS.PACKET
    return 'getPacketId'
  }
  if (sig.endsWith('L' + clsInfo.obfName + ';') && methodInfo.static && !methodInfo.origName.startsWith('value')) return 'get'
  if (sig === '()I') return 'getId'
}

export function field (field, clsInfo, info) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/Map;': return field.isStatic() ? 'BACKWARD' : 'FORWARD'
    case '[L' + clsInfo.obfName + ';': return 'STATES'
  }
}

function clinit (methodInfo) {
  console.log('ConnectionState.<clinit>')
  const {code, clsInfo} = methodInfo
  let current = {}
  for (const line of code.lines) {
    console.log(line)
    if (line.op === 'new') {
      console.log(line.className)
      current.instanceClass = line.className
    } else if (typeof line.const === 'string') {
      console.log(line.const)
      current.name = line.const
    } else if (line.op === 'putstatic' && current.instanceClass) {
      clsInfo.field[line.field.fieldName] = current.name
      console.log(current)
      current = {}
    }
  }
}
