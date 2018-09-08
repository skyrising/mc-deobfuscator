// @flow

export function field (fieldInfo: FieldInfo) {
  const { sig } = fieldInfo
  switch (sig) {
    case 'I': return 'color'
  }
}
