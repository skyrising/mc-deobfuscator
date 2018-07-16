export function method (cls, method, code, methodInfo, clsInfo, info) {
  const sig = method.getSignature()
  if (sig.endsWith('Ljava/io/OutputStream;)V')) return 'writeCompressed'
  if (sig.endsWith('Ljava/io/DataOutput;)V')) return 'writeRootCompound'
  if (sig.startsWith('(Ljava/io/InputStream;)L')) return 'readCompressed'
  if (sig.startsWith('(Ljava/io/DataInput;)L')) return 'readRootCompound'
}
