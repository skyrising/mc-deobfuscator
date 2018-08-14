export function method (methodInfo) {
  switch (methodInfo.sig) {
    case '(Ljava/io/File;)V':
    case '(Ljava/net/URL;)V':
    case '(Ljava/net/URI;)V':
    case '(Ljava/lang/String;)V': return 'open'
    case '(Ljava/net/URL;)[Ljava/lang/String;': return 'getOpenCommand'
  }
}
