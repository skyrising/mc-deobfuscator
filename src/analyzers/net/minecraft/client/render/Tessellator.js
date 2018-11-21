// @flow

import { GL_QUADS } from '../../../../../GLConsts.json'

export function method (methodInfo: MethodInfo) {
  const { code, sig, clsInfo } = methodInfo
  const firstLine = code.lines[0]
  if (methodInfo.obfName === '<init>') {
    for (const line of code.lines) {
      if (line.call) {
        const call = line.call.methodName
        if (call === 'asIntBuffer') clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'bufInt'
        else if (call === 'asFloatBuffer') clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'bufFloat'
      }
    }
    const getVBOSupported = firstLine.nextOp('getfield org.lwjgl.opengl.ContextCapabilities.GL_ARB_vertex_buffer_object:Z')
    if (getVBOSupported) {
      clsInfo.fields[getVBOSupported.prevOp('getstatic').field.fieldName].name = 'enableVBO'
      clsInfo.fields[getVBOSupported.nextOp('putfield').field.fieldName].name = 'useVBO'
    }
  }
  switch (sig) {
    case '()V':
      if (code.consts.length === 1 && code.consts[0] === GL_QUADS) return 'beginQuads'
      if (code.consts.includes('Not tesselating!')) return 'end'
      return
    case '(I)V':
      if (code.consts.includes('Already tesselating!')) {
        const tesselating = firstLine.nextOp('getfield').field
        clsInfo.fields[tesselating.fieldName].name = 'tesselating'
        return 'begin'
      }
      return
    case '(FFFF)V':
    case '(III)V': return 'setColor'
    case '(IIII)V': {
      const hasColor = firstLine.nextOp('iconst_1').nextOp('putfield')
      clsInfo.fields[hasColor.field.fieldName].name = 'hasColor'
      clsInfo.fields[hasColor.nextOp('putfield').field.fieldName].name = 'color'
      return 'setColor'
    }
    case '(FFF)V': return 'wrong'
    // case '(FFF)V': return code.consts.includes('But..') ? 'setNormal' : code.consts.length ? 'setColor' : 'translate'
    case '()L' + clsInfo.obfName + ';': return 'getInstance'
    case '(DDDDD)V': return 'addVertex'
    case '(DDD)V':
      if (code.lines.length < 16) {
        clsInfo.fields[firstLine.nextOp('dload_1').nextOp('putfield').field.fieldName].name = 'translateX'
        clsInfo.fields[firstLine.nextOp('dload_3').nextOp('putfield').field.fieldName].name = 'translateY'
        clsInfo.fields[firstLine.nextOp('dload %5').nextOp('putfield').field.fieldName].name = 'translateZ'
        return 'setTranslation'
      }
      return 'addVertex'
    case '(DD)V':
      clsInfo.fields[firstLine.nextOp('putfield').field.fieldName].name = 'hasTexCoord'
      clsInfo.fields[firstLine.nextOp('dload_1').nextOp('putfield').field.fieldName].name = 'texCoordU'
      clsInfo.fields[firstLine.nextOp('dload_3').nextOp('putfield').field.fieldName].name = 'texCoordV'
      return 'setTexCoord'
  }
}
export function field (fieldInfo: FieldInfo) {
  const { clsInfo } = fieldInfo
  switch (fieldInfo.sig) {
    case 'L' + clsInfo.obfName + ';': return 'instance'
    case 'Ljava/nio/ByteBuffer;': return 'buf'
    case '[I': return 'data'
  }
}
