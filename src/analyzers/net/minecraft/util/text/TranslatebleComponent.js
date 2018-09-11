// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'key'
    case '[Ljava/lang/Object;': return 'args'
    case 'Ljava/lang/Object;': return 'lock'
  }
}
