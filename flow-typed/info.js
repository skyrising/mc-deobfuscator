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
declare type BytecodeOpLoadConst = 'ldc' | 'ldc_w' | 'ldc2_w'
declare type BytecodeOpConst = BytecodeOpNumberConst | BytecodeOpLoadConst
declare type BytecodeOpNew = 'new'
declare type BytecodeOpInvokeDynamic = 'invokedynamic'
declare type BytecodeOpLoad =
| 'iload' | 'iload_0' | 'iload_1' | 'iload_2' | 'iload_3'
| 'lload' | 'lload_0' | 'lload_1' | 'lload_2' | 'lload_3'
| 'fload' | 'fload_0' | 'fload_1' | 'fload_2' | 'fload_3'
| 'dload' | 'dload_0' | 'dload_1' | 'dload_2' | 'dload_3'
| 'aload' | 'aload_0' | 'aload_1' | 'aload_2' | 'aload_3'
declare type BytecodeOpReturn = 'ireturn' | 'lreturn' | 'freturn' | 'dreturn' | 'areturn' | 'return'

declare type BytecodeOp =
| BytecodeOpField
| BytecodeOpCall
| BytecodeOpConst
| BytecodeOpNew
| BytecodeOpInvokeDynamic
| BytecodeOpLoad
| BytecodeOpReturn

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

declare type IntegerConstant = {| type: 'int', value: number, line: CodeLineNumberConst|CodeLineLoadConst |}

declare type Constant =
| {| type: 'string'|'class', value: string, line: CodeLineLoadConst |}
| IntegerConstant
| {| type: 'double', value: number, line: CodeLineLoadConst |}
| {| type: 'unknown', value: any, line: CodeLineLoadConst|CodeLineNumberConst |}
| {| type: 'long', value: any, line: CodeLineLoadConst |}

declare type CodeLineNumberConst = CodeLineBase & {|
  op: BytecodeOpNumberConst;
  const: number;
  constant: IntegerConstant;
|}

declare type CodeLineLoadConst = CodeLineBase & {|
  op: BytecodeOpLoadConst;
  const: string | number;
  constant: Constant;
|}

declare type CodeLineNew = CodeLineBase & {|
  op: BytecodeOpNew;
  className: string;
|}

declare type CodeLineInvokeDynamic = CodeLineBase & {|
  op: BytecodeOpInvokeDynamic;
  invokeDynamic: {
    bootstrapMethod: {
      method: any;
      args: Array<any>;
      argIndexes: Array<number>;
    };
    name: string;
    descriptor: string;
  };
|}

declare type CodeLineLoad = CodeLineBase & {|
  op: BytecodeOpLoad;
  load: number;
  loadType: 'i' | 'l' | 'f' | 'd' | 'a';
|}

declare type CodeLineReturn = CodeLineBase & {|
  op: BytecodeOpReturn;
  return: true;
  returnType: 'i' | 'l' | 'f' | 'd' | 'a';
|}

declare type CodeLine =
| CodeLineField
| CodeLineCall
| CodeLineNumberConst
| CodeLineLoadConst
| CodeLineNew
| CodeLineInvokeDynamic
| CodeLineLoad
| CodeLineReturn

declare type Code = {
  lines: Array<CodeLine>;
  consts: Array<string|number>;
  constants: Array<Constant>;
  fields: Array<OpField>;
  calls: Array<OpCall>;
  matches (predicates: Array<string | RegExp | (CodeLine => any)>): boolean;
  error?: Error;
}

declare type ClassAccessFlags = {|
  public: boolean;
  final: boolean;
  super: boolean;
  interface: boolean;
  abstract: boolean;
  synthetic: boolean;
  annotation: boolean;
  enum: boolean;
  module: boolean;
|}

declare type FieldAccessFlags = {|
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

declare type MethodAccessFlags = {|
  public: boolean;
  private: boolean;
  protected: boolean;
  static: boolean;
  final: boolean;
  synchronized: boolean;
  bridge: boolean;
  varargs: boolean;
  native: boolean;
  abstract: boolean;
  strict: boolean;
  synthetic: boolean;
|}

declare type MethodInfo = {
  type: 'method';
  name: string;
  obfName: string;
  sig: string;
  args: Array<BCELType>;
  argSigs: Array<string>;
  ret: BCELType;
  retSig: string;
  code: Code;
  acc: number;
  clsInfo: ClassInfo;
  info: FullInfo;
  done: boolean;
  infoComplete: boolean;
  flags: MethodAccessFlags;
  attributes: {[string]: any};
  getter?: boolean | FieldInfo;
  setter?: boolean | FieldInfo;
  bestName: string;
  depends?: (() => ?string) | MethodInfo;
}

declare type FieldInfo = {
  type: 'field';
  name: string;
  obfName: string;
  sig: string;
  rawGenericSignature?: string;
  fieldType: BCELType;
  acc: number;
  clsInfo: ClassInfo;
  info: FullInfo;
  done: boolean;
  accessorSuffix?: string;
  flags: FieldAccessFlags;
  attributes: {[string]: any};
  bestName: string;
  depends?: (() => ?string) | FieldInfo;
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
  allSubClasses: Set<string>;
  interfaceNames: Array<string>;
  flags: ClassAccessFlags;
  ...({|
    isInnerClass: false;
  |} | {|
    isInnerClass: true;
    outerClassName: string;
  |});
  innerClasses: Set<ClassInfo>;
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

declare type Task = {
  predicate (FullInfo): any;
  run (FullInfo): any;
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
  enriched: boolean;
  newPass (name: string, info?: {weight: number}): Pass;
  scheduleTask (task: Task): void;
  runScheduledTasks (all?: boolean): void;
} & events$EventEmitter;

declare type InfoData = {
  post?: () => any;
  [string]: any;
}

type Awaitable<T> = T | Promise<T>

declare type Analyzer = {
  name?: string;
  file?: string;
  init?: FullInfo => Awaitable<any>;
  cls?: (ClassInfo) => Awaitable<?string>;
  method?: (MethodInfo) => Awaitable<?string>;
  field?: (FieldInfo) => Awaitable<?string>;
}
