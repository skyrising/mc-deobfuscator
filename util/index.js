import * as PKG from '../PackageNames'

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

export function sortObfClassName (a, b) {
  const topA = a.includes('$') ? a.slice(0, a.indexOf('$')) : a
  const topB = b.includes('$') ? b.slice(0, b.indexOf('$')) : b
  if (topA.length !== topB.length) return topA.length - topB.length
  if (topA > topB) return 1
  if (topA < topB) return -1
  if (a > b) return 1
  if (a < b) return -1
  return 0
}

export function waiter () {
  const p = new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (p.waitingFor) p.waitingFor.then(resolve).catch(reject)
      p._waitingFor = p.waitingFor
      Object.assign(p, {
        set waitingFor (wf) {
          wf.then(resolve).catch(reject)
          this._waitingFor = wf
        },
        get waitingFor () {
          return this._waitingFor
        }
      })
    })
  })
  return p
}

export function getMappedClassName (info, from) {
  const to = info.class[from]
  if (from.indexOf('$') < 0) {
    if (to.name) return to.name.replace(/\./g, '/')
    if (from.length >= 6) return from.replace(/\./g, '/')
    return PKG.DEFAULT.replace(/\./g, '/') + '/' + getDefaultName(to)
  }
  const toEnd = (to.name || from).slice((to.name || from).lastIndexOf('$') + 1)
  return getMappedClassName(info, from.slice(0, from.lastIndexOf('$'))) + '$' + toEnd
}
