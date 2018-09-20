// @flow

export function field (fieldInfo: FieldInfo) {
  switch (fieldInfo.sig) {
    case 'Ljava/util/UUID;': return 'id'
    case 'Ljava/lang/String:': case 'Ljava/util/function/Supplier;': return 'name'
    case 'I': return 'operation'
    case 'D': return 'amount'
    case 'Z':
      fieldInfo.accessorSuffix = 'serialized'
      return 'serialize'
  }
}
