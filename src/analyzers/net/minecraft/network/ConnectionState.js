// @flow
import * as CLASS from '../../../../ClassNames'
import * as PKG from '../../../../PackageNames'
import { slash } from '../../../../util'

export function method (methodInfo: MethodInfo) {
  const { sig, clsInfo, info } = methodInfo
  if (methodInfo.origName === '<clinit>') return clinit(methodInfo)
  if (sig.endsWith(')Ljava/lang/Integer;')) {
    info.class[methodInfo.argSigs[1].slice(1, -1)].name = CLASS.PACKET
    return 'getPacketId'
  }
  if (sig.endsWith('L' + clsInfo.obfName + ';') && methodInfo.flags.static && !methodInfo.origName.startsWith('value')) return 'get'
  if (sig === '()I') return 'getId'
}

export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  switch (fieldInfo.sig) {
    case 'Ljava/util/Map;': return fieldInfo.flags.static ? 'BACKWARD' : 'FORWARD'
    case '[L' + clsInfo.obfName + ';': return 'STATES'
  }
}

function clinit (methodInfo: MethodInfo) {
  console.log('ConnectionState.<clinit>')
  const { code, clsInfo, info } = methodInfo
  if (!info.data.network) info.data.network = {}
  const data = info.data.network
  if (data.packets) return
  data.post = function () {
    for (const state of Object.values(this.packets)) {
      for (const direction of [state.clientbound, state.serverbound]) {
        if (!direction) continue
        const fieldsUnique = {}
        for (const packet of direction) {
          fieldsUnique[packet.fields] = (fieldsUnique[packet.fields] || 0) + 1
        }
        for (const packet of direction) {
          packet.fieldsUnique = fieldsUnique[packet.fields] === 1
          packet.className = info.class[packet.className].name || packet.className
          packet.fields = packet.fields.replace(/L([a-z$\d]{1,6})(?=[;<])/g, (full, obfName) => {
            if (!(obfName in info.class)) return full
            return `L${slash(info.class[obfName].name || obfName)}`
          })
        }
      }
    }
  }
  data.packets = {}
  let current = {}
  for (const line of code.lines) {
    console.log(line)
    if (line.op === 'new') {
      console.log(line.className)
      current.instanceClassName = line.className
      current.instanceClass = info.class[line.className]
    } else if (typeof line.const === 'string') {
      console.log(line.const)
      current.name = line.const
    } else if (line.op === 'putstatic' && current.instanceClass) {
      clsInfo.fields[line.field.fieldName].name = current.name
      const lcName = current.name.toLowerCase()
      if (!data.packets[lcName]) data.packets[lcName] = {}
      console.log(current)
      if (current.instanceClass) {
        const init = current.instanceClass.method['<init>:(Ljava/lang/String;II)V']
        if (init) {
          for (const line of init.code.lines) {
            if (line.op !== 'invokevirtual') continue
            const ldcLine = line.previous
            if (!ldcLine || ldcLine.op !== 'ldc') continue
            const packetClassName = ldcLine.const
            const dirLine = ldcLine.previous
            if (!dirLine || dirLine.op !== 'getstatic') continue
            const dirObfName = dirLine.field.fieldName
            const srcName = ({ a: 'client', b: 'server' })[dirObfName]
            if (!srcName) continue
            const dirName = ({ a: 'serverbound', b: 'clientbound' })[dirObfName]
            const dirShort = ({ a: 'C2S', b: 'S2C' })[dirObfName]
            const packetClass = info.class[packetClassName]
            const pkg = packetClass.package = `${PKG.NETWORK}.${lcName}.${srcName}`
            const fields = []
            let latestType = ''
            let latestCount = 0
            const fieldsObf = []
            for (const fieldInfo of ((Object.values(packetClass.fields): any): Array<FieldInfo>)) {
              if (fieldInfo.flags.static) continue
              fieldsObf.push(fieldInfo)
              const sig = fieldInfo.rawGenericSignature || fieldInfo.sig
              if (latestType !== sig) {
                if (latestType) fields.push({ type: latestType, count: latestCount })
                latestType = sig
                latestCount = 1
              } else {
                latestCount++
              }
            }
            if (latestType && latestCount) fields.push({ type: latestType, count: latestCount })
            const fieldsStr = fields.map(f => f.count > 1 ? `${f.count}*${f.type}` : f.type).join(',')
            let fieldsDeobf
            const getName = () => {
              switch (lcName) {
                case 'handshaking': {
                  packetClass.name = CLASS.PACKET_HANDSHAKING_HANDSHAKE
                  const constrSig = `<init>:(Ljava/lang/String;IL${clsInfo.obfName};)V`
                  const constr = constrSig in packetClass.method && packetClass.method[constrSig]
                  if (constr) {
                    for (const line of constr.code.lines) {
                      if (typeof line.const !== 'number') continue
                      info.data.general = info.data.general || {}
                      info.data.general.protocolVersion = data.version = line.const
                      break
                    }
                  }
                  break
                }
                case 'play': {
                  switch (dirName + ',' + fieldsStr) {
                    case 'clientbound,I,Ljava/util/UUID;,3*D,7*I':
                      fieldsDeobf = ['entityId', 'uuid', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'pitch', 'yaw', 'type', 'data']
                      return pkg + '.SpawnEntity' + dirShort
                    case 'serverbound,I,Ljava/lang/String;':
                      fieldsDeobf = ['id', 'command']
                      return pkg + '.AutocompleteRequest' + dirShort
                    case 'clientbound,I,Lcom/mojang/brigadier/suggestion/Suggestions;':
                      fieldsDeobf = ['id', 'suggestions']
                      return pkg + '.AutocompleteSuggestions' + dirShort
                    case 'clientbound,I,S,Z':
                    case 'serverbound,I,S,Z':
                      fieldsDeobf = ['window', 'action', 'accepted']
                      return pkg + '.WindowActionResponse' + dirShort
                    case 'clientbound,J':
                    case 'serverbound,J':
                      fieldsDeobf = ['id']
                      return pkg + '.KeepAlive' + dirShort
                    case 'serverbound,3*D,2*F,3*Z':
                      fieldsDeobf = ['x', 'y', 'z', 'yaw', 'pitch', 'onGround', 'hasPosition', 'hasAngles']
                      return pkg + '.MovePlayer' + dirShort
                    case 'serverbound,3*D,2*F':
                      fieldsDeobf = ['x', 'y', 'z', 'yaw', 'pitch']
                      return pkg + '.MoveVehicle' + dirShort
                    case 'serverbound,2*Z':
                      fieldsDeobf = ['leftPaddle', 'rightPaddle']
                      return pkg + '.SteerBoat' + dirShort
                    case 'serverbound,4*Z,2*F':
                      fieldsDeobf = ['creative', 'flying', 'canFly', 'invulnerable', 'flyingSpeed', 'walkingSpeed']
                      return pkg + '.PlayerAbilities' + dirShort
                    case `serverbound,I,L${packetClassName}$a;,I`:
                      fieldsDeobf = ['playerId', 'action', 'jumpBoostPercent']
                      return pkg + '.PlayerAction' + dirShort
                    case 'serverbound,2*F,2*Z':
                      fieldsDeobf = ['strafeSpeed', 'forwardSpeed', 'jumping', 'sneaking']
                      return pkg + '.PlayerInput' + dirShort
                    case 'clientbound,I,F':
                      // TODO
                  }
                  break
                }
                case 'status': {
                  switch (dirName + ',' + fieldsStr) {
                    case 'serverbound,': return pkg + '.StatusRequest' + dirShort
                    case 'serverbound,J':
                      fieldsDeobf = ['payload']
                      return pkg + '.StatusPing' + dirShort
                    case 'clientbound,J':
                      fieldsDeobf = ['payload']
                      return pkg + '.StatusPong' + dirShort
                  }
                  return pkg + '.StatusResponse' + dirShort
                }
                case 'login': {
                  if (packetClass.consts.has('Payload may not be larger than 1048576 bytes')) {
                    if (dirName === 'clientbound') {
                      fieldsDeobf = ['id', 'channel', 'payload']
                    } else {
                      fieldsDeobf = ['id', 'payload']
                    }
                    return pkg + '.PluginNegotiation' + dirShort
                  }
                  switch (dirName + ',' + fieldsStr) {
                    case 'clientbound,Ljava/lang/String;,Ljava/security/PublicKey;,[B':
                      fieldsDeobf = ['serverId', 'publicKey', 'token']
                      return pkg + '.EncryptionRequest' + dirShort
                    case 'clientbound,Lcom/mojang/authlib/GameProfile;':
                      fieldsDeobf = ['player']
                      return pkg + '.LoginSuccess' + dirShort
                    case 'clientbound,I':
                      fieldsDeobf = ['threshold']
                      return pkg + '.SetCompression' + dirShort
                    case 'serverbound,Lcom/mojang/authlib/GameProfile;':
                      fieldsDeobf = ['player']
                      return pkg + '.Hello' + dirShort
                    case 'serverbound,2*[B':
                      fieldsDeobf = ['sharedSecret', 'token']
                      return pkg + '.Key' + dirShort
                  }
                  break
                }
              }
            }
            try {
              const name = getName()
              if (name) packetClass.name = name
              if (fieldsDeobf && fieldsDeobf.length === fieldsObf.length) {
                for (let i = 0; i < fieldsDeobf.length; i++) {
                  if (!fieldsDeobf[i]) continue
                  fieldsObf[i].name = fieldsDeobf[i]
                }
              }
            } catch (e) {
              console.error(e)
            }
            if (!data.packets[lcName][dirName]) data.packets[lcName][dirName] = []
            const packetData = {
              id: data.packets[lcName][dirName].length,
              className: packetClassName,
              fields: fieldsStr
            }
            data.packets[lcName][dirName].push(packetData)
          }
        }
      }
      current = {}
    }
  }
}
