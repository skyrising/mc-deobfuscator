declare type BCELMethod = {
  getNameAsync: () => Promise<string>;
  getCodeAsync: () => Promise<BCELCode>;
  getAccessFlagsAsync: () => Promise<number>;
  getArgumentTypesAsync: () => Promise<Array<BCELType>>;
  getReturnTypeAsync: () => Promise<BCELType>;
  isAbstract: () => Promise<boolean>;
}

declare type BCELField = {
  getNameAsync: () => Promise<string>;
  getTypeAsync: () => Promise<BCELType>;
  getAccessFlagsAsync: () => Promise<number>;
}

declare type BCELType = {
  getSignature: () => string;
  getSignatureAsync: () => Promise<string>;
}

declare type BCELCode = {
  toStringAsync: () => Promise<string>;
}

declare type BCELClass = {
  getClassNameAsync: () => Promise<string>;
  getPackageNameAsync: () => Promise<string>;
  getFieldsAsync: () => Promise<Array<BCELField>>;
  getMethodsAsync: () => Promise<Array<BCELMethod>>;
  getAccessFlagsAsync: () => Promise<number>;
}

declare type BCELRepository = {
  lookupClassAsync: string => Promise<BCELClass>;
}
