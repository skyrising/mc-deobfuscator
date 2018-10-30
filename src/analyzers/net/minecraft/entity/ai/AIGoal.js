// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'I': return 'mutexBits'
  }
}

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '()Z': {
      if (methodInfo.flags.abstract) return 'shouldExecute'
      if (methodInfo.code.lines[0].op === 'iconst_1') return 'isInterruptible'
      return 'shouldContinueExecuting'
    }
  }
}
