declare type ClassSignature = {|
  type: 'ClassSignature';
  formalTypeParameters?: FormalTypeParameters;
  superClassSignature: ClassTypeSignature;
  superInterfaceSignatures: Array<ClassTypeSignature>;
|}

declare type FormalTypeParameters = {|
  type: 'FormalTypeParameters';
  value: Array<FormalTypeParameter>;
|}

declare type FormalTypeParameter = {|
  type: 'FormalTypeParameter';
  identifier: string;
  classBound?: FieldTypeSignature;
  interfacesBound: Array<FieldTypeSignature>;
|}

declare type TypeVariableSignature = {|
  type: 'TypeVariable';
  identifier: string;
|}

declare type FieldTypeSignature =
| ClassTypeSignature
| ArrayTypeSignature
| TypeVariableSignature

declare type ClassTypeSignature = {|
  type: 'ClassTypeSignature';
  simple: Array<SimpleClassTypeSignature>;
  package?: string;
|}

declare type SimpleClassTypeSignature = {|
  type: 'SimpleClassTypeSignature';
  identifier: string;
  typeArguments?: TypeArguments;
|}

declare type TypeArguments = {|
  type: 'TypeArguments';
  value: Array<TypeArgument>;
|}

declare type TypeArgument = {|
  type: 'TypeArgument';
  value: '*'
|} | {|
  type: 'TypeArgument';
  wildcard?: '+' | '-';
  value: FieldTypeSignature;
|}

declare type ArrayTypeSignature = {|
  type: 'ArrayTypeSignature';
  base: TypeSignature;
|}

declare type TypeSignature = {|
  type: 'TypeSignature';
  value: BaseType | FieldTypeSignature;
|}

declare type BaseType = {|
  type: 'BaseType';
  ...(
    | {| raw: 'B', value: 'byte' |}
    | {| raw: 'C', value: 'char' |}
    | {| raw: 'D', value: 'double' |}
    | {| raw: 'F', value: 'float' |}
    | {| raw: 'I', value: 'int' |}
    | {| raw: 'J', value: 'long' |}
    | {| raw: 'S', value: 'short' |}
    | {| raw: 'Z', value: 'boolean' |}
  )
|}

declare type ParseResult<O, I> = [O | void, I]
declare type Parser<O, I> = (I) => ParseResult<O, I>
