// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Z': return 'modifier'
    case 'Ljava/lang/Integer;': return 'color'
    case 'Ljava/util/regex/Pattern;': return 'FORMAT_PATTERN'
  }
}
