export function method (cls, method, code, methodInfo, clsInfo, info) {
  switch (methodInfo.sig) {
    case '()B': return 'getByte'
    case '()S': return 'getShort'
    case '()I': return 'getInt'
    case '()J': return 'getLong'
    case '()F': return 'getFloat'
    case '()D': return 'getDouble'
  }
}
