// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../util/code'
import { constructorFieldNamer } from '../../../sharedLogic'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case '[Lcom/mojang/authlib/GameProfile;': return 'sample'
  }
}

export function method (methodInfo: MethodInfo) {
  if (methodInfo.obfName === '<init>') return constructorFieldNamer(methodInfo, ['max', 'online'])
}
