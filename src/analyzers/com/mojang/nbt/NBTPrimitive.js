// @flow

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '()B': return 'getByte'
    case '()S': return 'getShort'
    case '()I': return 'getInt'
    case '()J': return 'getLong'
    case '()F': return 'getFloat'
    case '()D': return 'getDouble'
  }
}
