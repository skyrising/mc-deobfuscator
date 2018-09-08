// @flow

import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { sig, code, clsInfo, info } = methodInfo
  const Builder = clsInfo.obfName
  if (methodInfo.name === '<init>' && methodInfo.args.length === 2 && sig.startsWith('(L')) {
    info.class[methodInfo.argSigs[0].slice(1, -1)].name = CLASS.MATERIAL
    info.class[methodInfo.argSigs[1].slice(1, -1)].name = CLASS.MAP_COLOR
  }
  if (sig.endsWith(')L' + Builder + ';') && methodInfo.static) return 'create'
  switch (sig) {
    case '(I)L' + Builder + ';': return 'setLightOpacity'
    case '(FF)L' + Builder + ';': return 'setHardnessAndResistance'
    case '(F)L' + Builder + ';': {
      if (code.lines[2] && code.lines[2].field) return 'setSlipperiness'
      return 'setHardnessAndResistance'
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.MAP_COLOR}`) return 'mapColor'
  if (s`${CLASS.MATERIAL}`) return 'material'
  switch (fieldInfo.sig) {
    case 'I': return 'lightOpacity'
  }
}
