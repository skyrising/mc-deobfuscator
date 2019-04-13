// @flow
import * as CLASS from '../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  if (s`${CLASS.ENTITY}`.matches(fieldInfo)) return 'entity'
  if (s`${CLASS.SERVER_WORLD}`.matches(fieldInfo)) return 'world'
  if (s`${CLASS.VEC_3D}`.matches(fieldInfo)) return 'position'
  switch (fieldInfo.sig) {
    case 'Lcom/mojang/brigadier/ResultConsumer;': return 'resultConsumer'
    case 'Lnet/minecraft/server/MinecraftServer;': return 'server'
  }
}
