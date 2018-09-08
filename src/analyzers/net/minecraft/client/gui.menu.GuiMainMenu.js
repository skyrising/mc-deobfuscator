// @flow

export function method (methodInfo: MethodInfo) {
  const {code, clsInfo} = methodInfo
  for (const line of code.lines) {
    if (!line.const) continue
    switch (line.const) {
      case 'missingno':
        clsInfo.fields[line.nextOp('putfield').field.fieldName].name = 'splashText'
        break
      case 'Copyright Mojang AB. Do not distribute.': return 'drawScreen'
      case '/title/black.png': return 'drawLogo'
    }
  }
}
