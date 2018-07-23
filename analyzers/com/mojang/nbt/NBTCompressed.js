export function method (cls, method, code, methodInfo, clsInfo, info) {
  if (methodInfo.sig.endsWith('Ljava/io/OutputStream;)V')) return 'writeCompressed'
  if (methodInfo.sig.endsWith('Ljava/io/DataOutput;)V')) return 'writeRootCompound'
  if (methodInfo.sig.startsWith('(Ljava/io/InputStream;)L')) return 'readCompressed'
  if (methodInfo.sig.startsWith('(Ljava/io/DataInput;)L')) return 'readRootCompound'
}
