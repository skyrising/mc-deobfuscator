import path from 'path'
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
  return cls.getInterfaceNames().includes(name)
}

export const slash = s => s.replace(/\./g, '/')
export const dot = s => s.replace(/\//g, '.')

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

export function toUnderScoreCase (camelCase) {
  const usc = camelCase.replace(/[A-Z]/g, c => '_' + c)
  if (usc.startsWith('_')) return usc.slice(1)
  return usc
}

export function getReturnType (sig) {
  if (typeof sig !== 'string') {
    console.log('get return type of method: ' + Error().stack.split('\n')[2])
    sig = sig.getSignature()
  }
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

const useHashNaming = true
export function getDefaultName (clsInfo) {
  const main = ucFirst(clsInfo.obfName) + (useHashNaming ? ucFirst(clsInfo.hashBase26) : '')
  if (clsInfo.enumNames) return 'Enum' + main
  if (clsInfo.isInterface) return 'If' + main
  return 'Cls' + main
}

export function sortObfClassNamePart (a, b) {
  const numA = +a
  const numB = +b
  if (isFinite(numA) && isFinite(numB)) return numA - numB
  if (a.length !== b.length) return a.length - b.length
  return a === b ? 0 : a > b ? 1 : -1
}

export function sortObfClassName (a, b) {
  const partsA = a.split('$')
  const partsB = b.split('$')
  for (let i = 0; i < partsA.length && i < partsB.length; i++) {
    const cmp = sortObfClassNamePart(partsA[i], partsB[i])
    if (cmp) return cmp
  }
  return partsA.length - partsB.length
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
  if (info.obfName) {
    from = info.obfName
    info = info.info
  }
  const to = info.class[from]
  if (from.indexOf('$') < 0) {
    if (to.name) return to.name.replace(/\./g, '/')
    if (from.length >= 6) return from.replace(/\./g, '/')
    console.debug('Mapping class name ' + to.obfName + ' with package ' + (to.package || PKG.DEFAULT) + ' -> ' + (to.package || PKG.DEFAULT).replace(/\./g, '/') + '/' + getDefaultName(to))
    return (to.package || PKG.DEFAULT).replace(/\./g, '/') + '/' + getDefaultName(to)
  }
  const toEnd = (to.name || from).slice((to.name || from).lastIndexOf('$') + 1)
  return getMappedClassName(info, from.slice(0, from.lastIndexOf('$'))) + '$' + toEnd
}

const logged = new Set()
export function getCallStats (obj) {
  const name = obj.getClass ? obj.getClass().getSimpleName() : (obj[Symbol.toStringTag] || obj.prototype.constructor.name)
  return new Proxy(obj, {
    get (base, key) {
      const value = base[key]
      if (typeof value === 'function') {
        const line = name + '.' + key + Error().stack.split('\n')[2].replace(path.resolve(__dirname, '..') + '/', '')
        if (!logged.has(line)) console.debug(line)
        logged.add(line)
        return (...args) => {
          return value.call(base, ...args)
        }
      }
      return value
    }
  })
}
