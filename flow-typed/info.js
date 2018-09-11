declare type Side = 'client' | 'server'

declare type Version = {
  id: string;
}

declare type OpCall = {
  fullSig: string;
  pkg: string;
  className: string;
  methodName: string;
  signature: string;
}

declare type OpField = {
  fullSig: string;
  pkg: string;
  className: string;
  fullClassName: string;
  fieldName: string;
  type: string;
}

declare type BytecodeOpField = 'putstatic' | 'putfield' | 'getstatic' | 'getfield'
declare type BytecodeOpCall = 'invokestatic' | 'invokevirtual' | 'invokeinterface' | 'invokespecial'
declare type BytecodeOpNumberConst = 'bipush' | 'sipush' | 'ipush'
declare type BytecodeOpLoadConst = 'ldc' | 'ldc_w'
declare type BytecodeOpConst = BytecodeOpNumberConst | BytecodeOpLoadConst
declare type BytecodeOpNew = 'new'

declare type BytecodeOp =
| BytecodeOpField
| BytecodeOpCall
| BytecodeOpConst
| BytecodeOpNew

interface CodeLine$$matching_op {
  (BytecodeOpField, includeSelf?: boolean): ?CodeLineField;
  (BytecodeOpCall, includeSelf?: boolean): ?CodeLineCall;
  (BytecodeOpNumberConst, includeSelf?: boolean): ?CodeLineNumberConst;
  (BytecodeOpLoadConst, includeSelf?: boolean): ?CodeLineLoadConst;
  (BytecodeOpNew, includeSelf?: boolean): ?CodeLineNew;
  (BytecodeOp, includeSelf?: boolean): ?CodeLine;
  (Array<BytecodeOp>, includeSelf?: boolean): ?CodeLine;
}

type CodeLineBase = {|
  offset: number;
  arg: string;
  next?: CodeLine;
  nextMatching: ((CodeLine) => boolean, includeSelf?: boolean) => ?CodeLine;
  nextOp: CodeLine$$matching_op;
  previous?: CodeLine;
  prevMatching: ((CodeLine) => boolean, includeSelf?: boolean) => ?CodeLine;
  prevOp: CodeLine$$matching_op;
|}

declare type CodeLineField = CodeLineBase & {|
  op: BytecodeOpField;
  field: OpField;
|}

declare type CodeLineCall = CodeLineBase & {|
  op: BytecodeOpCall;
  call: OpCall;
|}

declare type CodeLineNumberConst = CodeLineBase & {|
  op: BytecodeOpNumberConst;
  const: number;
|}

declare type CodeLineLoadConst = CodeLineBase & {|
  op: BytecodeOpLoadConst;
  const: string | number;
|}

declare type CodeLineNew = CodeLineBase & {|
  op: BytecodeOpNew;
  className: string;
|}

declare type CodeLine =
| CodeLineField
| CodeLineCall
| CodeLineNumberConst
| CodeLineLoadConst
| CodeLineNew

declare type Code = {
  lines: Array<CodeLine>;
  consts: Array<string|number>;
  fields: Array<OpField>;
  internalFields: Array<OpField>;
  calls: Array<OpCall>;
  internalCalls: Array<OpCall>;
}

declare type AccessFlags = {|
  public: boolean;
  private: boolean;
  protected: boolean;
  static: boolean;
  final: boolean;
  volatile: boolean;
  transient: boolean;
  synthetic: boolean;
  enum: boolean;
|}

declare type MethodInfo = {
  type: 'method';
  name: string;
  origName: string;
  sig: string;
  args: Array<BCELType>;
  argSigs: Array<string>;
  ret: BCELType;
  retSig: string;
  isAbstract: boolean;
  code: Code;
  acc: number;
  clsInfo: ClassInfo;
  info: FullInfo;
  done: boolean;
  infoComplete: boolean;
  ...AccessFlags;
  getter?: boolean | FieldInfo;
  setter?: boolean | FieldInfo;
}

declare type FieldInfo = {
  type: 'field';
  name: string;
  obfName: string;
  sig: string;
  fieldType: BCELType;
  acc: number;
  clsInfo: ClassInfo;
  info: FullInfo;
  done: boolean;
  ...AccessFlags;
}

declare type ClassInfo = {
  type: 'class';
  obfName: string;
  name: ?string;
  package: ?string;
  method: {[string]: MethodInfo};
  reverseMethod: {[string]: ?string};
  fields: {[string]: FieldInfo};
  consts: Set<string|number>;
  superClassName: string;
  subClasses: Set<string>;
  interfaceNames: Array<string>;
  isInterface: boolean;
  isAbstract: boolean;
  ...({|
    isInnerClass: false;
  |} | {|
    isInnerClass: true;
    outerClassName: string;
  |});
  enumNames: Array<string>;
  attributes: {[string]: any};
  rawGenericSignature: string;
  genericSignature: ClassSignature;
  analyzing?: Promise<any>;
  info: FullInfo;
  done: boolean;
  hash: number;
  hashBase26: string;
  infoComplete: boolean;
  analyzer?: Analyzer
}

declare type Pass = {
  name: string;
  weight: number;
  started: boolean;
  ended: boolean;
  analyzed: number;
  start (): void;
  end (): void;
}

declare type FullInfo = {
  running: number;
  pass: number;
  passes: Array<Pass>;
  currentPass: ?Pass;
  maxParallel: number;
  numAnalyzed: number;
  classAnalyzeAvg: number;
  genericAnalyzed: {[string]: number};
  specialAnalyzed: {[string]: number};
  totalAnalyzed: {[string]: number};
  classNames: Array<string>;
  classReverse: {[string]: ?string};
  class: {[string]: ClassInfo};
  method: {[string]: MethodInfo};
  data: {[string]: any};
  newPass (name: string, info?: {weight: number}): Pass;
} & events$EventEmitter;

declare type InfoData = {
  post?: () => any;
  [string]: any;
}

type Awaitable<T> = T | Promise<T>

interface Analyzer$$cls {
  (ClassInfo): Awaitable<?string>;
  (BCELClass, ClassInfo, FullInfo): Awaitable<?string>;
}

interface Analyzer$$method {
  (MethodInfo): Awaitable<?string>;
  (BCELClass, BCELMethod, Code, MethodInfo, ClassInfo, FullInfo): Awaitable<?string>;
}

interface Analyzer$$field {
  (FieldInfo): Awaitable<?string>;
  (BCELField, ClassInfo, FullInfo, BCELClass): Awaitable<?string>;
}

declare type Analyzer = {
  name?: string;
  file?: string;
  init?: FullInfo => Awaitable<any>;
  cls?: Analyzer$$cls;
  method?: Analyzer$$method;
  field?: Analyzer$$field;
}
