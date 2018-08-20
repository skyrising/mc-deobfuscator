export function method (methodInfo) {
  if (methodInfo.origName === '<clinit>') {
    for (const line of methodInfo.code.lines) {
      if (typeof line.const !== 'string') continue
      const fieldName = ({
        'textures/entity/fish/tropical_a.png': 'BASE_TEXTURES',
        'textures/entity/fish/tropical_a_pattern_1.png': 'A_PATTERN_TEXTURES',
        'textures/entity/fish/tropical_b_pattern_1.png': 'B_PATTERN_TEXTURES'
      })[line.const]
      if (fieldName) {
        const putstatic = line.nextOp('putstatic')
        if (putstatic) methodInfo.clsInfo.field[putstatic.field.fieldName] = fieldName
      }
    }
  }
}
