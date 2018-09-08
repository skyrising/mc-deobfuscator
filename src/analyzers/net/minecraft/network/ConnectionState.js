// @flow
import * as CLASS from '../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const {sig, clsInfo, info} = methodInfo
  if (methodInfo.origName === '<clinit>') return clinit(methodInfo)
  if (sig.endsWith(')Ljava/lang/Integer;')) {
    info.class[methodInfo.argSigs[1].slice(1, -1)].name = CLASS.PACKET
    return 'getPacketId'
  }
  if (sig.endsWith('L' + clsInfo.obfName + ';') && methodInfo.static && !methodInfo.origName.startsWith('value')) return 'get'
  if (sig === '()I') return 'getId'
}

export function field (fieldInfo: FieldInfo) {
  const {sig, clsInfo} = fieldInfo
  switch (sig) {
    case 'Ljava/util/Map;': return fieldInfo.static ? 'BACKWARD' : 'FORWARD'
    case '[L' + clsInfo.obfName + ';': return 'STATES'
  }
}

function clinit (methodInfo: MethodInfo) {
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
      clsInfo.fields[line.field.fieldName].name = current.name
      console.log(current)
      current = {}
    }
  }
}
