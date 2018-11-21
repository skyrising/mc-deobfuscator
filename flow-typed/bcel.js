declare type BCELType = {|
  getSignature(): string;
  getSignatureAsync(): Promise<string>;
|}

declare type BCELMethod = {|
  ...BCELType;
  getNameAsync(): Promise<string>;
  getCodeAsync(): Promise<BCELCode>;
  getAccessFlagsAsync(): Promise<number>;
  getArgumentTypesAsync(): Promise<Array<BCELType>>;
  getReturnTypeAsync(): Promise<BCELType>;
  isAbstract(): Promise<boolean>;
|}

declare type BCELField = {|
  ...BCELType;
  getNameAsync(): Promise<string>;
  getTypeAsync(): Promise<BCELType>;
  getAccessFlagsAsync(): Promise<number>;
|}

declare type BCELCode = {|
  toStringAsync(): Promise<string>;
|}

declare type BCELClass = {|
  ...BCELType;
  getClassNameAsync(): Promise<string>;
  getPackageNameAsync(): Promise<string>;
  getFieldsAsync(): Promise<Array<BCELField>>;
  getMethodsAsync(): Promise<Array<BCELMethod>>;
  getAccessFlagsAsync(): Promise<number>;
  getSuperclassNameAsync(): Promise<string>;
  getInterfaceNamesAsync(): Promise<Array<string>>;
  getConstantPoolAsync(): Promise<BCELConstantPool>;
|}

declare type BCELConstantPool = {|
  getConstant(index: number): BCELConstant;
|}

declare type BCELConstant = {|
  getTag(): number;
  getBytes(cp?: BCELConstantPool): string|number;
  getClassIndex(): number;
  getNameAndTypeIndex(): number;
  getNameIndex(): number;
  getSignatureIndex(): number;
  getReferenceKind(): number;
  getReferenceIndex(): number;
  getDescriptorIndex(): number;
  getBootstrapMethodAttrIndex(): number;
|}

declare type BCELBootstrapMethod = {|
  getBootstrapMethodRef(): number;
  getBootstrapArguments(): Array<number>;
|}

declare type BCELRepository = {|
  lookupClassAsync: string => Promise<BCELClass>;
|}
