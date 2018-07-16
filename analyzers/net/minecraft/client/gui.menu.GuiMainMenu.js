
export function method (cls, method, code, methodInfo, clsInfo, info) {
  for (const line of code.lines) {
    if (!line.const) continue
    switch (line.const) {
      case 'missingno':
        clsInfo.field[line.nextOp('putfield').field.fieldName] = 'splashText'
        break
      case 'Copyright Mojang AB. Do not distribute.': return 'drawScreen'
      case '/title/black.png': return 'drawLogo'
    }
  }
}
