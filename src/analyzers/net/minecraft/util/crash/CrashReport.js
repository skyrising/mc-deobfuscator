// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'message'
    case 'Ljava/lang/Throwable;': return 'cause'
    case 'Ljava/util/List;': return 'otherSections'
    case 'Z': return 'hasStackTrace'
    case '[Ljava/lang/StackTraceElement;': return 'stackTrace'
  }
  if (s`${CLASS.CRASH_REPORT_CATEGORY}`.matches(fieldInfo)) return 'systemDetailsSection'
}

export function method (methodInfo: MethodInfo) {
  switch (methodInfo.sig) {
    case '(Ljava/io/File;)Z': return 'writeToFile'
    case '()Ljava/lang/String;': {
      if (methodInfo.code.consts.includes('---- Minecraft Crash Report ----\n')) return 'asString'
      if (methodInfo.code.consts.includes('Witty comment unavailable :(')) return 'generateWittyComment'
      break
    }
    case '()V': return 'fillSystemDetails'
  }
  if (s`(Ljava/lang/String;)${CLASS.CRASH_REPORT_CATEGORY}`.matches(methodInfo)) return 'addElement(name)'
  if (s`(Ljava/lang/String;I)${CLASS.CRASH_REPORT_CATEGORY}`.matches(methodInfo)) return 'addElement(name,stackDepth)'
  if (s`(Ljava/lang/StringBuilder;)V`.matches(methodInfo)) return 'addStackTrace'
  if (s`(Ljava/lang/Throwable;Ljava/lang/String;)${CLASS.CRASH_REPORT}`.matches(methodInfo)) return 'create(cause,message)'
}
