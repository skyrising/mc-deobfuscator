export function method (cls, method, code, methodInfo, clsInfo, info) {
  console.debug('MapColor.method', method.origName)
  if (methodInfo.origName === '<init>') return init(cls, method, code, methodInfo, clsInfo, info)
  if (methodInfo.origName === '<clinit>') return clinit(cls, method, code, methodInfo, clsInfo, info)
  if (methodInfo.sig === '(I)I') return 'getMapColor'
}

function init (cls, method, code, methodInfo, clsInfo, info) {
  for (const line of code.lines) {
    if (line.op === 'iload_1' && line.next.op === 'putfield') clsInfo.field[line.next.field.fieldName] = 'index'
    else if (line.op === 'iload_2' && line.next.op === 'putfield') clsInfo.field[line.next.field.fieldName] = 'color'
  }
}

const COLOR_NAME = {
  0x000000: 'BLACK',
  0x191919: 'GRAY_19',
  0x251610: 'CONCRETE_BLACK',
  0x392923: 'CONCRETE_GRAY',
  0x4c4c4c: 'GRAY_4C',
  0x707070: 'GRAY_70',
  0x999999: 'GRAY_99',
  0xa7a7a7: 'GRAY_A7',
  0xc7c7c7: 'GRAY_C7',
  0xfffcf5: 'REDISH_WHITE',
  0xffffff: 'WHITE',
  0xa0a0ff: 'BLUISH_GRAY',
  0xa4a8b8: 'CLAY',
  0x007c00: 'FOLIAGE_GREEN',
  0x667f33: 'GREEN',
  0x7fcc19: 'LIME',
  0x00d93a: 'EMERALD',
  0x7fb238: 'SUSHI_GREEN',
  0x677535: 'CONCRETE_LIME',
  0x4c522a: 'CONCRETE_GREEN',
  0xf7e9a3: 'SAND',
  0x876b62: 'CONCRETE_SILVER',
  0x976d4d: 'DIRT',
  0x8f7748: 'WOOD',
  0x664c33: 'BROWN',
  0x4c3223: 'CONCRETE_BROWN',
  0x815631: 'OBSIDIAN',
  0x9f5224: 'CONCRETE_ORANGE',
  0x8e3c2e: 'CONCRETE_RED',
  0x700200: 'NETHERRACK',
  0x993333: 'MUDDY_RED',
  0xa04d4e: 'CONCRETE_PINK',
  0xff0000: 'RED',
  0xd87f33: 'ORANGE',
  0xba8524: 'CONCRETE_YELLOW',
  0xfaee4d: 'GOLD',
  0xe5e533: 'YELLOW',
  0x4040ff: 'WATER',
  0x334cb2: 'BLUE',
  0x4a80ff: 'LAPIS',
  0x5cdbd5: 'DIAMOND',
  0x6699d8: 'LIGHT_BLUE',
  0x4c7f99: 'CYAN',
  0x575c5c: 'CONCRETE_CYAN',
  0x706c8a: 'CONCRETE_LIGHT_BLUE',
  0x4c3e5c: 'CONCRETE_BLUE',
  0x7f3fb2: 'PURPLE',
  0xb24cd8: 'MAGENTA',
  0xf27fa5: 'PINK',
  0x7a4958: 'CONCRETE_PURPLE',
  0x95576c: 'CONCRETE_MAGENTA',
  0xd1b1a1: 'CONCRETE_WHITE'
}

function clinit (cls, method, code, methodInfo, clsInfo, info) {
  for (const line of code.lines) {
    // if (line.const) console.log(line.const.toString(16))
    if (typeof line.const === 'number' && COLOR_NAME[line.const]) {
      // console.log('Color: ' + line.const.toString(16) + ' ' + COLOR_NAME[line.const])
      clsInfo.field[line.nextOp('putstatic').field.fieldName] = COLOR_NAME[line.const]
    } else if (line.op === 'anewarray') {
      const length = +line.previous.arg
      if (length === 64) clsInfo.field[line.nextOp('putstatic').field.fieldName] = 'COLORS'
      else if (length === 16) clsInfo.field[line.nextOp('putstatic').field.fieldName] = 'BASE_COLORS'
    }
  }
}
