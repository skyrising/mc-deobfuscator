import {GL_QUADS} from '../../../../GLConsts'

export function method (cls, method, code, methodInfo, clsInfo, info) {
  const {sig} = methodInfo
  const firstLine = code.lines[0]
  if (methodInfo.origName === '<init>') {
    for (const line of code.lines) {
      if (line.call) {
        const call = line.call.methodName
        if (call === 'asIntBuffer') clsInfo.field[line.nextOp('putfield').field.fieldName] = 'bufInt'
        else if (call === 'asFloatBuffer') clsInfo.field[line.nextOp('putfield').field.fieldName] = 'bufFloat'
      }
    }
    const getVBOSupported = firstLine.nextOp('getfield org.lwjgl.opengl.ContextCapabilities.GL_ARB_vertex_buffer_object:Z')
    if (getVBOSupported) {
      clsInfo.field[getVBOSupported.prevOp('getstatic').field.fieldName] = 'enableVBO'
      clsInfo.field[getVBOSupported.nextOp('putfield').field.fieldName] = 'useVBO'
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
        clsInfo.field[tesselating.fieldName] = 'tesselating'
        return 'begin'
      }
      return
    case '(FFFF)V':
    case '(III)V': return 'setColor'
    case '(IIII)V': {
      const hasColor = firstLine.nextOp('iconst_1').nextOp('putfield')
      clsInfo.field[hasColor.field.fieldName] = 'hasColor'
      clsInfo.field[hasColor.nextOp('putfield').field.fieldName] = 'color'
      return 'setColor'
    }
    case '(FFF)V': return 'wrong'
    // case '(FFF)V': return code.consts.includes('But..') ? 'setNormal' : code.consts.length ? 'setColor' : 'translate'
    case '()L' + clsInfo.obfName + ';': return 'getInstance'
    case '(DDDDD)V': return 'addVertex'
    case '(DDD)V':
      if (code.lines.length < 16) {
        clsInfo.field[firstLine.nextOp('dload_1').nextOp('putfield').field.fieldName] = 'translateX'
        clsInfo.field[firstLine.nextOp('dload_3').nextOp('putfield').field.fieldName] = 'translateY'
        clsInfo.field[firstLine.nextOp('dload %5').nextOp('putfield').field.fieldName] = 'translateZ'
        return 'setTranslation'
      }
      return 'addVertex'
    case '(DD)V':
      clsInfo.field[firstLine.nextOp('putfield').field.fieldName] = 'hasTexCoord'
      clsInfo.field[firstLine.nextOp('dload_1').nextOp('putfield').field.fieldName] = 'texCoordU'
      clsInfo.field[firstLine.nextOp('dload_3').nextOp('putfield').field.fieldName] = 'texCoordV'
      return 'setTexCoord'
  }
}
export function field (fieldInfo) {
  const {sig, clsInfo} = fieldInfo
  switch (sig) {
    case 'L' + clsInfo.obfName + ';': return 'instance'
    case 'Ljava/nio/ByteBuffer;': return 'buf'
    case '[I': return 'data'
  }
}
