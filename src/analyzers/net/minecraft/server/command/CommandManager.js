// @flow

import * as PKG from '../../../../../PackageNames'

export function method (methodInfo: MethodInfo) {
  const { info } = methodInfo
  if (methodInfo.obfName === '<init>') {
    for (const line of methodInfo.code.lines) {
      if (line.op !== 'invokestatic' || line.call.signature !== '(Lcom/mojang/brigadier/CommandDispatcher;)V') continue
      const commandCls = info.class[line.call.fullClassName]
      commandCls.method[line.call.methodName + ':' + line.call.signature].name = 'register'
      commandCls.package = PKG.COMMAND_IMPL
    }
  }
  switch (methodInfo.sig) {
    case '(Ljava/lang/String;)Lcom/mojang/brigadier/builder/LiteralArgumentBuilder;': return 'build'
  }
  if (methodInfo.sig.endsWith(')Ljava/util/function/Predicate;')) return 'valid'
}

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Lcom/mojang/brigadier/CommandDispatcher;': return 'dispatcher'
  }
}
