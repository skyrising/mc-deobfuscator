
/*
ClassSignature:
  FormalTypeParameters? SuperclassSignature SuperinterfaceSignature*
SuperclassSignature:
  ClassTypeSignature
SuperinterfaceSignature:
  ClassTypeSignature
*/
export function parseClassSignature (sig) {
  const cs = {type: 'ClassSignature'}
  let sigLoop = sig
  ;[cs.formalTypeParameters, sigLoop] = parseFormalTypeParameters(sigLoop)
  ;[cs.superClassSignature, sigLoop] = parseClassTypeSignature(sigLoop)
  if (!cs.superClassSignature) return [undefined, sig]
  cs.superInterfaceSignatures = []
  let sis
  while (sigLoop) {
    [sis, sigLoop] = parseClassTypeSignature(sigLoop)
    if (sis) cs.superInterfaceSignatures.push(sis)
    else break
  }
  return [cs, sigLoop]
}

/*
FormalTypeParameters:
  < FormalTypeParameter+ >
*/
export function parseFormalTypeParameters (sig) {
  if (sig[0] !== '<') return [undefined, sig]
  sig = sig.slice(1)
  const ftps = []
  while (sig[0] !== '>') {
    const [ftp, sig1] = parseFormalTypeParameter(sig)
    if (!ftp) return [undefined, sig]
    sig = sig1
    ftps.push(ftp)
  }
  return [{type: 'FormalTypeParameters', value: ftps}, sig.slice(1)]
}

/*
FormalTypeParameter:
  Identifier ClassBound InterfaceBound*
ClassBound:
  : FieldTypeSignature?
InterfaceBound:
  : FieldTypeSignature
*/
export function parseFormalTypeParameter (sig) {
  const colon = sig.indexOf(':')
  if (colon < 0) return [undefined, sig]
  const identifier = sig.slice(0, colon)
  const [classBound, sig1] = parseFieldTypeSignature(sig.slice(colon + 1))
  const interfacesBound = []
  let sigLoop = sig1
  while (sigLoop[0] === ':') {
    const [ifb, sig2] = parseFieldTypeSignature(sigLoop.slice(1))
    if (!ifb) return [undefined, sig]
    interfacesBound.push(ifb)
    sigLoop = sig2
  }
  return [{
    type: 'FormalTypeParameter',
    identifier,
    classBound,
    interfacesBound
  }, sigLoop]
}

/*
TypeVariableSignature:
  T Identifier ;
*/
export function parseTypeVariableSignature (sig) {
  const end = sig.indexOf(';')
  if (sig[0] !== 'T' || end < 0) return [undefined, sig]
  return [{type: 'TypeVariable', identifier: sig.slice(1, end)}, sig.slice(end + 1)]
}

/*
FieldTypeSignature:
  ClassTypeSignature
  ArrayTypeSignature
  TypeVariableSignature
*/
export function parseFieldTypeSignature (sig) {
  if (sig[0] === 'L') return parseClassTypeSignature(sig)
  if (sig[0] === '[') return parseArrayTypeSignature(sig)
  if (sig[0] === 'T') return parseTypeVariableSignature(sig)
  return [undefined, sig]
}

/*
ClassTypeSignature:
  L PackageSpecifier? SimpleClassTypeSignature ClassTypeSignatureSuffix* ;
PackageSpecifier:
  Identifier / PackageSpecifier*
ClassTypeSignatureSuffix:
  . SimpleClassTypeSignature
*/
export function parseClassTypeSignature (sig) {
  if (sig[0] !== 'L') return [undefined, sig]
  const cts = {type: 'ClassTypeSignature', simple: []}
  let sigLoop = sig.slice(1)
  const slash = sigLoop.lastIndexOf('/', sigLoop.indexOf(';'))
  let simple
  if (slash > 0) {
    cts.package = sigLoop.slice(0, slash)
    sigLoop = sigLoop.slice(slash + 1)
  }
  [simple, sigLoop] = parseSimpleClassTypeSignature(sigLoop)
  cts.simple.push(simple)
  while (sigLoop[0] === '.') {
    [simple, sigLoop] = parseSimpleClassTypeSignature(sigLoop.slice(1))
    cts.simple.push(simple)
  }
  if (sigLoop[0] !== ';') return [undefined, sig]
  return [cts, sigLoop.slice(1)]
}

/*
SimpleClassTypeSignature:
  Identifier TypeArguments?
*/
export function parseSimpleClassTypeSignature (sig) {
  const i = Math.min(...[sig.indexOf('<'), sig.indexOf('.'), sig.indexOf(';')].filter(x => x >= 0))
  if (!isFinite(i)) return [undefined, sig]
  const scts = {type: 'SimpleClassTypeSignature', identifier: sig.slice(0, i)}
  let sigLoop = sig.slice(i)
  if (sigLoop[0] === '<') [scts.typeArguments, sigLoop] = parseTypeArguments(sigLoop)
  return [scts, sigLoop]
}

/*
TypeArguments:
  < TypeArgument+ >
*/
export function parseTypeArguments (sig) {
  if (sig[0] !== '<') return [undefined, sig]
  const tas = {type: 'TypeArguments', value: []}
  let ta
  let sigLoop = sig.slice(1)
  while (sigLoop) {
    [ta, sigLoop] = parseTypeArgument(sigLoop)
    tas.value.push(ta)
    if (sigLoop[0] === '>') break
  }
  return [tas, sigLoop.slice(1)]
}

/*
TypeArgument:
  WildcardIndicator? FieldTypeSignature
  *
WildcardIndicator:
  +
  -
*/
export function parseTypeArgument (sig) {
  if (sig[0] === '*') return [{type: 'TypeArgument', value: '*'}, sig.slice(1)]
  const ta = {type: 'TypeAgument'}
  let sig1 = sig
  if (sig1[0] === '+' || sig1[0] === '-') {
    ta.wildcard = sig1[0]
    sig1 = sig1.slice(1)
  }
  [ta.value, sig1] = parseFieldTypeSignature(sig1)
  if (!ta.value) return [undefined, sig]
  return [ta, sig1]
}

/*
ArrayTypeSignature:
  [ TypeSignature
*/
export function parseArrayTypeSignature (sig) {
  if (sig[0] !== '[') return [undefined, sig]
  const [type, sig1] = parseTypeSignature(sig.slice(1))
  if (type) return [{type: 'ArrayTypeSignature', base: type}, sig1]
  return [undefined, sig]
}

/*
TypeSignature:
  FieldTypeSignature
  BaseType
*/
export function parseTypeSignature (sig) {
  const [baseType, sig1] = parseBaseType(sig)
  if (baseType) return [{type: 'TypeSignature', value: baseType}, sig1]
  const [fts, sig2] = parseFieldTypeSignature(sig)
  if (fts) return [{type: 'TypeSignature', value: fts}, sig2]
  return [undefined, sig]
}

const BASE_TYPES = {
  B: 'byte',
  C: 'char',
  D: 'double',
  F: 'float',
  I: 'int',
  J: 'long',
  S: 'short',
  Z: 'boolean'
}

/*
BaseType:
  B
  C
  D
  F
  I
  J
  S
  Z
*/
export function parseBaseType (sig) {
  if (sig[0] in BASE_TYPES) return [{type: 'BaseType', raw: sig[0], value: BASE_TYPES[sig[0]]}, sig.slice(1)]
  return [undefined, sig]
}
