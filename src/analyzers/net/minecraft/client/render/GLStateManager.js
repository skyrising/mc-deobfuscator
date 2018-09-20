// @flow
import * as CLASS from '../../../../../ClassNames'
import * as GL from '../../../../../GLConsts.json'
import { signatureTag as s } from '../../../../../util/code'

export function method (methodInfo: MethodInfo) {
  const { code, clsInfo } = methodInfo
  if (s`(${CLASS.GL_STATE_MANAGER$SOURCE_FACTOR}${CLASS.GL_STATE_MANAGER$DEST_FACTOR})V`.matches(methodInfo)) {
    const blendFuncCall = code.lines[0].nextOp('invokestatic', true)
    if (blendFuncCall) clsInfo.method[blendFuncCall.call.methodName + ':' + blendFuncCall.call.signature].name = 'setBlendFunc'
    return 'setBlendFunc'
  }
  if (s`(${CLASS.GL_STATE_MANAGER$SOURCE_FACTOR}${CLASS.GL_STATE_MANAGER$DEST_FACTOR}${CLASS.GL_STATE_MANAGER$SOURCE_FACTOR}${CLASS.GL_STATE_MANAGER$DEST_FACTOR})V`.matches(methodInfo)) {
    const blendFuncCall = code.lines[0].nextOp('invokestatic', true)
    if (blendFuncCall) clsInfo.method[blendFuncCall.call.methodName + ':' + blendFuncCall.call.signature].name = 'setBlendFuncSeparate'
    return 'setBlendFuncSeparate'
  }
  if (s`(${CLASS.GL_STATE_MANAGER$FOG_MODE})V`.matches(methodInfo)) {
    const fogModeCall = code.lines[0].nextOp('invokestatic', true)
    if (fogModeCall) clsInfo.method[fogModeCall.call.methodName + ':' + fogModeCall.call.signature].name = 'setFogMode'
    return 'setFogMode'
  }
  if (s`(${CLASS.GL_STATE_MANAGER$CULL_FACE})V`.matches(methodInfo)) {
    const cullFaceCall = code.lines[0].nextOp('invokestatic', true)
    if (cullFaceCall) clsInfo.method[cullFaceCall.call.methodName + ':' + cullFaceCall.call.signature].name = 'setCullFace'
    return 'setCullFace'
  }
  if (s`(${CLASS.GL_STATE_MANAGER$LOGIC_OP})V`.matches(methodInfo)) {
    const logicOpCall = code.lines[0].nextOp('invokestatic', true)
    if (logicOpCall) clsInfo.method[logicOpCall.call.methodName + ':' + logicOpCall.call.signature].name = 'setLogicOp'
    return 'setLogicOp'
  }
  switch (methodInfo.sig) {
    case '()V': {
      if (code.matches([
        line => line.op === 'sipush' && line.const === (GL.ENABLE_BIT | GL.LIGHTING_BIT),
        line => line.op === 'invokestatic' && line.arg.startsWith('org.lwjgl.opengl.GL11.glPushAttrib:(I)V'),
        'return'
      ])) return 'pushAttrib'
      if (code.matches([
        line => line.op === 'invokestatic' && line.arg.startsWith('org.lwjgl.opengl.GL11.glPopAttrib:()V'),
        'return'
      ])) return 'popAttrib'
      break
    }
    case '(I)V': {
      if (code.matches([
        'iload_0',
        line => line.op === 'invokestatic' && line.arg.startsWith('org.lwjgl.opengl.GL14.glBlendEquation:(I)V'),
        'return'
      ])) return 'blendEquation'
      break
    }
    case '(F)V': {
      if (code.consts.includes(GL.FOG_START)) return 'setFogStart'
      if (code.consts.includes(GL.FOG_END)) return 'setFogEnd'
      if (code.consts.includes(GL.FOG_DENSITY)) return 'setFogDensity'
      break
    }
    case '(Ljava/nio/FloatBuffer;Lorg/lwjgl/util/vector/Quaternion;)Ljava/nio/FloatBuffer;': return 'quaternionToMatrix'
  }
}
