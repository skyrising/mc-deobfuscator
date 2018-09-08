// @flow
import {range} from './util'

const byValue: Array<{[Category]: string}> = ({}: any)

type Category =
| 'array'
| 'attrib'
| 'boolean'
| 'condition'
| 'depth'
| 'error'
| 'light'
| 'line'
| 'mask'
| 'matrix'
| 'poly'
| 'prop'
| 'point'
| 'render_primitive'
| 'rot'
| 'side'
| 'type'

function register (category: Category|Array<Category>, value: number, name: string) {
  module.exports[name] = value
  const glName = 'GL_' + name
  module.exports[glName] = value
  if (!(value in byValue)) byValue[value] = {}
  if (!Array.isArray(category)) category = [category]
  for (const cat of category) byValue[value][cat] = glName
}

register('boolean', 0, 'FALSE')
register('boolean', 1, 'TRUE')

register('type', 0x1400, 'BYTE')
register('type', 0x1401, 'UNSIGNED_BYTE')
register('type', 0x1402, 'SHORT')
register('type', 0x1403, 'UNSIGNED_SHORT')
register('type', 0x1404, 'INT')
register('type', 0x1405, 'UNSIGNED_INT')
register('type', 0x1406, 'FLOAT')
register('type', 0x1407, '2_BYTES')
register('type', 0x1408, '3_BYTES')
register('type', 0x1409, '4_BYTES')
register('type', 0x140A, 'DOUBLE')

register('render_primitive', 0x0000, 'POINTS')
register('render_primitive', 0x0001, 'LINES')
register('render_primitive', 0x0002, 'LINE_LOOP')
register('render_primitive', 0x0003, 'LINE_STRIP')
register('render_primitive', 0x0004, 'TRIANGLES')
register('render_primitive', 0x0005, 'TRIANGLE_STRIP')
register('render_primitive', 0x0006, 'TRIANGLE_FAN')
register('render_primitive', 0x0007, 'QUADS')
register('render_primitive', 0x0008, 'QUAD_STRIP')
register('render_primitive', 0x0009, 'POLYGON')

register(['array', 'type'], 0x8074, 'VERTEX_ARRAY')
register(['array', 'type'], 0x8075, 'NORMAL_ARRAY')
register(['array', 'type'], 0x8076, 'COLOR_ARRAY')
register(['array', 'type'], 0x8077, 'INDEX_ARRAY')
register(['array', 'type'], 0x8078, 'TEXTURE_COORD_ARRAY')
register(['array', 'type'], 0x8079, 'EDGE_FLAG_ARRAY')
register(['array', 'prop'], 0x807A, 'VERTEX_ARRAY_SIZE')
register(['array', 'prop'], 0x807B, 'VERTEX_ARRAY_TYPE')
register(['array', 'prop'], 0x807C, 'VERTEX_ARRAY_STRIDE')
register(['array', 'prop'], 0x807E, 'NORMAL_ARRAY_TYPE')
register(['array', 'prop'], 0x807F, 'NORMAL_ARRAY_STRIDE')
register(['array', 'prop'], 0x8081, 'COLOR_ARRAY_SIZE')
register(['array', 'prop'], 0x8082, 'COLOR_ARRAY_TYPE')
register(['array', 'prop'], 0x8083, 'COLOR_ARRAY_STRIDE')
register(['array', 'prop'], 0x8085, 'INDEX_ARRAY_TYPE')
register(['array', 'prop'], 0x8086, 'INDEX_ARRAY_STRIDE')
register(['array', 'prop'], 0x8088, 'TEXTURE_COORD_ARRAY_SIZE')
register(['array', 'prop'], 0x8089, 'TEXTURE_COORD_ARRAY_TYPE')
register(['array', 'prop'], 0x808A, 'TEXTURE_COORD_ARRAY_STRIDE')
register(['array', 'prop'], 0x808C, 'EDGE_FLAG_ARRAY_STRIDE')
register(['array', 'type'], 0x808E, 'VERTEX_ARRAY_POINTER')
register(['array', 'type'], 0x808F, 'NORMAL_ARRAY_POINTER')
register(['array', 'type'], 0x8090, 'COLOR_ARRAY_POINTER')
register(['array', 'type'], 0x8091, 'INDEX_ARRAY_POINTER')
register(['array', 'type'], 0x8092, 'TEXTURE_COORD_ARRAY_POINTER')
register(['array', 'type'], 0x8093, 'EDGE_FLAG_ARRAY_POINTER')
register(['array', 'type'], 0x2A20, 'V2F')
register(['array', 'type'], 0x2A21, 'V3F')
register(['array', 'type'], 0x2A22, 'C4UB_V2F')
register(['array', 'type'], 0x2A23, 'C4UB_V3F')
register(['array', 'type'], 0x2A24, 'C3F_V3F')
register(['array', 'type'], 0x2A25, 'N3F_V3F')
register(['array', 'type'], 0x2A26, 'C4F_N3F_V3F')
register(['array', 'type'], 0x2A27, 'T2F_V3F')
register(['array', 'type'], 0x2A28, 'T4F_V4F')
register(['array', 'type'], 0x2A29, 'T2F_C4UB_V3F')
register(['array', 'type'], 0x2A2A, 'T2F_C4F_V3F')
register(['array', 'type'], 0x2A2B, 'T2F_N3F_V3F')
register(['array', 'type'], 0x2A2C, 'T2F_C4F_N3F_V3F')
register(['array', 'type'], 0x2A2D, 'T4F_C4F_N3F_V4F')

register(['matrix', 'prop'], 0x0BA0, 'MATRIX_MODE')
register(['matrix'], 0x1700, 'MODELVIEW')
register(['matrix'], 0x1701, 'PROJECTION')
register(['matrix'], 0x1702, 'TEXTURE')

register(['point', 'prop'], 0x0B10, 'POINT_SMOOTH')
register(['point', 'prop'], 0x0B11, 'POINT_SIZE')
register(['point', 'prop'], 0x0B12, 'POINT_SIZE_RANGE')
register(['point', 'prop'], 0x0B13, 'POINT_SIZE_GRANULARITY')

register(['line', 'prop'], 0x0B20, 'LINE_SMOOTH')
register(['line', 'prop'], 0x0B21, 'LINE_WIDTH')
register(['line', 'prop'], 0x0B22, 'LINE_WIDTH_RANGE')
register(['line', 'prop'], 0x0B23, 'LINE_WIDTH_GRANULARITY')
register(['line', 'prop'], 0x0B24, 'LINE_STIPPLE')
register(['line', 'prop'], 0x0B25, 'LINE_STIPPLE_PATTERN')
register(['line', 'prop'], 0x0B26, 'LINE_STIPPLE_REPEAT')

register(['point', 'poly'], 0x1B00, 'POINT')
register(['line', 'poly'], 0x1B01, 'LINE')
register(['poly', 'prop'], 0x1B02, 'FILL')
register(['poly', 'prop', 'rot'], 0x0900, 'CW')
register(['poly', 'prop', 'rot'], 0x0901, 'CCW')
register(['poly', 'prop', 'side'], 0x0404, 'FRONT')
register(['poly', 'prop', 'side'], 0x0405, 'BACK')
register(['poly', 'prop', 'side'], 0x0406, 'LEFT')
register(['poly', 'prop', 'side'], 0x0407, 'RIGHT')
register(['poly', 'prop'], 0x0B40, 'POLYGON_MODE')
register(['poly', 'prop'], 0x0B41, 'POLYGON_SMOOTH')
register(['poly', 'prop'], 0x0B42, 'POLYGON_STIPPLE')
register(['poly', 'prop'], 0x0B43, 'EDGE_FLAG')
register(['poly', 'prop'], 0x0B44, 'CULL_FACE')
register(['poly', 'prop'], 0x0B45, 'CULL_FACE_MODE')
register(['poly', 'prop'], 0x0B46, 'FRONT_FACE')
register(['poly', 'prop'], 0x8038, 'POLYGON_OFFSET_FACTOR')
register(['poly', 'prop'], 0x2A00, 'POLYGON_OFFSET_UNITS')
register(['poly', 'prop'], 0x2A01, 'POLYGON_OFFSET_POINT')
register(['poly', 'prop'], 0x2A02, 'POLYGON_OFFSET_LINE')
register(['poly', 'prop'], 0x8037, 'POLYGON_OFFSET_FILL')

register(['depth', 'condition'], 0x0200, 'NEVER')
register(['depth', 'condition'], 0x0201, 'LESS')
register(['depth', 'condition'], 0x0202, 'EQUAL')
register(['depth', 'condition'], 0x0203, 'LEQUAL')
register(['depth', 'condition'], 0x0204, 'GREATER')
register(['depth', 'condition'], 0x0205, 'NOTEQUAL')
register(['depth', 'condition'], 0x0206, 'GEQUAL')
register(['depth', 'condition'], 0x0207, 'ALWAYS')
register(['depth', 'prop'], 0x0B70, 'DEPTH_RANGE')
register(['depth', 'prop'], 0x0B71, 'DEPTH_TEST')
register(['depth', 'prop'], 0x0B72, 'DEPTH_WRITEMASK')
register(['depth', 'prop'], 0x0B73, 'DEPTH_CLEAR_VALUE')
register(['depth', 'prop'], 0x0B74, 'DEPTH_FUNC')
register(['depth', 'prop'], 0x0D56, 'DEPTH_BITS')
register(['depth', 'prop'], 0x1902, 'DEPTH_COMPONENT')

register(['light', 'prop'], 0x0B50, 'LIGHTING')
range(0, 7).forEach(i => register(['light', 'prop'], 0x4000, 'LIGHT' + i))

register(['error'], 0, 'NO_ERROR')
register(['error'], 0x500, 'INVALID_ENUM')
register(['error'], 0x501, 'INVALID_VALUE')
register(['error'], 0x502, 'INVALID_OPERATION')
register(['error'], 0x503, 'STACK_OVERFLOW')
register(['error'], 0x504, 'STACK_UNDERFLOW')
register(['error'], 0x505, 'OUT_OF_MEMORY')

register(['attrib', 'mask'], 0x00000001, 'CURRENT_BIT')
register(['attrib', 'mask'], 0x00000002, 'POINT_BIT')
register(['attrib', 'mask'], 0x00000004, 'LINE_BIT')
register(['attrib', 'mask'], 0x00000005, 'POLYGON_BIT')
register(['attrib', 'mask'], 0x00000010, 'POLYGON_STIPPLE_BIT')
register(['attrib', 'mask'], 0x00000020, 'PIXEL_MODE_BIT')
register(['attrib', 'mask'], 0x00000040, 'LIGHTING_BIT')
register(['attrib', 'mask'], 0x00000080, 'FOG_BIT')
register(['attrib', 'mask'], 0x00000100, 'DEPTH_BUFFER_BIT')
register(['attrib', 'mask'], 0x00000200, 'ACCUM_BUFFER_BIT')
register(['attrib', 'mask'], 0x00000400, 'STENCIL_BUFFER_BIT')
register(['attrib', 'mask'], 0x00000800, 'VIEWPORT_BIT')
register(['attrib', 'mask'], 0x00001000, 'TRANSFORM_BIT')
register(['attrib', 'mask'], 0x00002000, 'ENABLE_BIT')
register(['attrib', 'mask'], 0x00004000, 'COLOR_BUFFER_BIT')
register(['attrib', 'mask'], 0x00008000, 'HINT_BIT')
register(['attrib', 'mask'], 0x00010000, 'EVAL_BIT')
register(['attrib', 'mask'], 0x00020000, 'LIST_BIT')
register(['attrib', 'mask'], 0x00040000, 'TEXTURE_BIT')
register(['attrib', 'mask'], 0x00080000, 'SCISSOR_BIT')
register(['attrib', 'mask'], 0xFFFFFFFF, 'ALL_ATTRIB_BITS')
