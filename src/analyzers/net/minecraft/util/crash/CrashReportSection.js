// @flow
import * as CLASS from '../../../../../ClassNames'
import { signatureTag as s } from '../../../../../util/code'

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/lang/String;': return 'title'
    case 'Ljava/util/List;': return 'elements'
    case '[Ljava/lang/StackTraceElement;': return 'stackTrace'
  }
  if (s`${CLASS.CRASH_REPORT}`.matches(fieldInfo)) return 'report'
}

export function method (methodInfo: MethodInfo) {
  if (methodInfo.obfName === '<init>') return '<init>(report,title)'
  switch (methodInfo.sig) {
    case '(DDD)Ljava/lang/String;':
    case '(III)Ljava/lang/String;':
      return 'createPositionString(x,y,z)'
    case '(Ljava/lang/String;Ljava/lang/Object;)V': return 'add(name,)'
    case '(Ljava/lang/String;Ljava/lang/Throwable;)V': return 'add(name,cause)'
    case '(Ljava/lang/StringBuilder;)V': return 'addStackTrace'
  }
  if (s`(${CLASS.CRASH_REPORT_CATEGORY}${CLASS.BLOCK_POS}${CLASS.BLOCK_STATE})V`.matches(methodInfo)) return 'addBlockInfo(section,pos,state)'
  if (s`(${CLASS.BLOCK_POS})Ljava/lang/String;`.matches(methodInfo)) return 'createPositionString(pos)'
  if (s`(Ljava/lang/String;${CLASS.CRASH_REPORT_DETAIL})V`.matches(methodInfo)) return 'add(name,detail)'
}
