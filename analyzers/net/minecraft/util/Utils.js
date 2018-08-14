import * as CLASS from '../../../../ClassNames'
import {signatureTag as s} from '../../../../util/code'

export function method (methodInfo) {
  if (s`()${CLASS.UTILS$OS}`.matches(methodInfo)) return 'getOS'
  switch (methodInfo.sig) {
    case '()Ljava/util/stream/Stream;': return 'getJVMArgs'
    case '(Ljava/util/concurrent/FutureTask;Lorg/apache/logging/log4j/Logger;)Ljava/lang/Object;':
      return 'executeTask'
  }
}

export function field (field, clsInfo, info, cls) {
  const sig = field.getType().getSignature()
  switch (sig) {
    case 'Ljava/util/function/LongSupplier;': return 'nanoTimeSupplier'
    case 'Ljava/util/regex/Pattern;': return 'RESERVED_WINDOWS_FILENAMES'
  }
}
