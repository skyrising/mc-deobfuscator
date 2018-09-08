// @flow

export function method (methodInfo: MethodInfo) {
  const {code, sig, clsInfo, info} = methodInfo
  switch (sig) {
    case '()Ljava/io/File;':
    case '(Ljava/lang/String;)Ljava/io/File;': return 'getWorkingDirectory'
    case '()L' + clsInfo.obfName.replace(/\./g, '/') + ';': return 'getInstance'
  }
  for (const c of code.consts) {
    switch (c) {
      case '########## GL ERROR ##########': return 'checkGlError'
      case 'Toggle fullscreen!': return 'toggleFullscreen'
      case 'FORCING RELOAD!': return 'forceReload'
      case 'Stopping!': return 'stop'
      case '/title/mojang.png': return 'renderSplashScreen'
      case 'Pre startup': return 'init'
      case 'Minecraft main thread': return 'start'
      case 'linux':
        info.class[methodInfo.retSig.slice(1, -1)].name = 'net.minecraft.util.OperatingSystem' // XXX
        return 'getOperatingSystem'
    }
  }
}

export function field (fieldInfo: FieldInfo) {
  const {sig, clsInfo} = fieldInfo
  switch (sig) {
    case 'Ljava/awt/Canvas;': return 'canvas'
    case 'Lnet/minecraft/client/MinecraftApplet;': return 'applet'
    case 'Ljava/io/File;': return 'workingDir'
    case 'L' + clsInfo.obfName.replace(/\./g, '/') + ';': return 'instance'
  }
}
