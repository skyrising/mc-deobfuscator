export function hasSuperClass (cls, name) {
  const scName = cls.getSuperclassName()
  if (scName === name) return true
  if (scName === 'java.lang.Object') return false
  try {
    const sc = cls.getSuperClass()
    return hasSuperClass(sc, name)
  } catch (e) {
    console.log('Cannot get superclass %s', cls.getSuperclassName())
    return false
  }
}

export function getSuperclassNames (cls) {
  const scName = cls.getSuperclassName()
  if (scName === 'java.lang.Object') return []
  try {
    const sc = cls.getSuperClass()
    return [sc.getClassName()].concat(getSuperclassNames(sc))
  } catch (e) {
    return []
  }
}

export function doesImplement (cls, name) {
  return cls.getInterfaces().map(c => c.getClassName()).includes(name)
}

export function ucFirst (s) {
  return s[0].toUpperCase() + s.slice(1)
}

export function toLowerCamelCase (underScoreCase) {
  const lcc = toUpperCamelCase(underScoreCase)
  return lcc[0].toLowerCase() + lcc.slice(1)
}

export function toUpperCamelCase (underScoreCase) {
  if (!Array.isArray(underScoreCase)) underScoreCase = underScoreCase.replace(/[.-]/g, '_')
  return (Array.isArray(underScoreCase) ? underScoreCase : underScoreCase.split('_')).map(ucFirst).join('')
}

export function getReturnType (sig) {
  if (typeof sig !== 'string') sig = sig.getSignature()
  const t = sig.slice(sig.lastIndexOf(')') + 1)
  return decodeAnyType(t)
}

export function range (from, to, step) {
  if (to === undefined) return range(0, from)
  step = step !== undefined ? step : to < 0 ? -1 : 1
  return Array.from(Array(Math.floor(Math.abs((to - from) / step) + 1)), (x, i) => from + i * step)
}

export function decodeAnyType (type) {
  return type.startsWith('L') ? decodeType(type) : type
}

export function decodeType (type) {
  if (!type.startsWith('L')) throw TypeError('Invalid object type ' + type)
  return type.slice(1, type.indexOf(';')).replace(/\//g, '.')
}

export function getDefaultName (clsInfo) {
  if (clsInfo.enumNames) return 'Enum' + ucFirst(clsInfo.obfName)
  if (clsInfo.isInterface) return 'If' + ucFirst(clsInfo.obfName)
  return 'Cls' + ucFirst(clsInfo.obfName)
}
