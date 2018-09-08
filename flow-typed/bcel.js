declare type BCELMethod = {
  getNameAsync: () => Promise<string>;
  getCodeAsync: () => Promise<BCELCode>;
}

declare type BCELField = {
  getNameAsync: () => Promise<string>;
  getTypeAsync: () => Promise<BCELType>;
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
}

declare type BCELRepository = {
  lookupClassAsync: string => Promise<BCELClass>;
}
