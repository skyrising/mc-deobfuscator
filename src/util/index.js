// @flow
import path from 'path'
import { performance } from 'perf_hooks'
import * as PKG from '../PackageNames'

export function hasSuperClass (clsInfo: ClassInfo, name: ?string) {
  if (!name) return false
  if (clsInfo.superClassName === name) return true
  if (clsInfo.superClassName === 'java.lang.Object') return false
  if (!clsInfo.info.classNames.includes(clsInfo.superClassName)) return false
  return hasSuperClass(clsInfo.info.class[clsInfo.superClassName], name)
}

export function getSuperclassNames (cls: BCELClass) {
  const scName = cls.getSuperclassName()
  if (scName === 'java.lang.Object') return []
  try {
    const sc = cls.getSuperClass()
    return [sc.getClassName()].concat(getSuperclassNames(sc))
  } catch (e) {
    return []
  }
}

export function getBaseInterfaces (clsInfo: ClassInfo) {
  const { interfaceNames, info } = clsInfo
  const list = []
  for (const i of interfaceNames) {
    if (!info.class[i]) {
      list.push(i)
      continue
    }
    const base = getBaseInterfaces(info.class[i])
    if (base.length) list.push(...base)
    else list.push(i)
  }
  return [...new Set(list)]
}

export function getAllInterfaces (clsInfo: ClassInfo) {
  const { interfaceNames, superClassName, info } = clsInfo
  const list = info.class[superClassName] ? getAllInterfaces(info.class[superClassName]) : []
  for (const i of interfaceNames) {
    if (!info.class[i]) {
      list.push(i)
      continue
    }
    list.push(i, ...getAllInterfaces(info.class[i]))
  }
  return [...new Set(list)]
}

export function doesImplement (cls: BCELClass, name: string) {
  return cls.getInterfaceNames().includes(name)
}

export function doesAnyImplement (clsInfo: ClassInfo, name: string) {
  if (clsInfo.interfaceNames.includes(name)) return true
  console.debug('does %s extend %s: not directly', clsInfo.obfName, name)
  for (const i of [clsInfo.superClassName, ...clsInfo.interfaceNames]) {
    const r = clsInfo.info.classNames.includes(i) && doesAnyImplement(clsInfo.info.class[i], name)
    console.debug('does %s extend %s via %s: %o', clsInfo.obfName, name, i, r)
    if (r) return true
  }
  return false
}

export const slash = (s: string) => s.replace(/\./g, '/')
export const dot = (s: string) => s.replace(/\//g, '.')

export function ucFirst (s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

export function lcFirst (s: string) {
  return s[0].toLowerCase() + s.slice(1)
}

export function toLowerCamelCase (underScoreCase: string) {
  const lcc = toUpperCamelCase(underScoreCase)
  return lcc[0].toLowerCase() + lcc.slice(1)
}

export function toUpperCamelCase (underScoreCase: string) {
  if (!Array.isArray(underScoreCase)) underScoreCase = underScoreCase.replace(/[.-]/g, '_')
  return (Array.isArray(underScoreCase) ? underScoreCase : underScoreCase.split('_')).map(ucFirst).join('')
}

export function toUnderScoreCase (camelCase: string) {
  const usc = camelCase.replace(/[A-Z]/g, c => '_' + c)
  if (usc.startsWith('_')) return usc.slice(1)
  return usc
}

export function getReturnType (sig: string) {
  if (typeof sig !== 'string') {
    console.log('get return type of method: ' + Error().stack.split('\n')[2])
    sig = sig.getSignature()
  }
  const t = sig.slice(sig.lastIndexOf(')') + 1)
  return decodeAnyType(t)
}

export function range (from: number, to?: number, step?: number): Array<number> {
  if (to === undefined) return range(0, from)
  const usedStep = step !== undefined ? step : to < 0 ? -1 : 1
  const numElems = Math.floor(Math.abs((to - from) / usedStep) + 1)
  const baseArray = Array(numElems)
  const mapFn = (x, i) => from + i * usedStep
  return Array.from(baseArray, mapFn)
}

export function decodeAnyType (type: string) {
  return type.startsWith('L') ? decodeType(type) : type
}

export function decodeType (type: string) {
  if (!type.startsWith('L')) throw TypeError('Invalid object type ' + type)
  return type.slice(1, type.indexOf(';')).replace(/\//g, '.')
}

const useHashNaming = true
export function getDefaultName (clsInfo: ClassInfo) {
  const main = ucFirst(clsInfo.obfName) + (useHashNaming ? ucFirst(clsInfo.hashBase26) : '')
  if (clsInfo.enumNames.length) return 'Enum' + main
  if (clsInfo.flags.interface) return 'If' + main
  return 'Cls' + main
}

export function sortObfClassNamePart (a: string, b: string) {
  const numA = +a
  const numB = +b
  if (isFinite(numA) && isFinite(numB)) return numA - numB
  if (a.length !== b.length) return a.length - b.length
  return a === b ? 0 : a > b ? 1 : -1
}

export function sortObfClassName (a: string, b: string) {
  const partsA = a.split('$')
  const partsB = b.split('$')
  for (let i = 0; i < partsA.length && i < partsB.length; i++) {
    const cmp = sortObfClassNamePart(partsA[i], partsB[i])
    if (cmp) return cmp
  }
  return partsA.length - partsB.length
}

export function getMappedClassName (infoIn: FullInfo | ClassInfo, from?: string) {
  if ('obfName' in infoIn) from = ((infoIn: any): ClassInfo).obfName
  const info: FullInfo = 'info' in infoIn ? ((infoIn: any): ClassInfo).info : (infoIn: any)
  if (!from) throw Error('Need obfuscated class name')
  const to = info.class[from]
  if (from.indexOf('$') < 0) {
    if (to.name) return to.name.replace(/\./g, '/')
    if (from.length >= 6) return from.replace(/\./g, '/')
    console.debug('Mapping class name ' + to.obfName + ' with package ' + (to.package || PKG.DEFAULT) + ' -> ' + (to.package || PKG.DEFAULT).replace(/\./g, '/') + '/' + getDefaultName(to))
    return (to.package || PKG.DEFAULT).replace(/\./g, '/') + '/' + getDefaultName(to)
  }
  const innerName = (to.name || from).slice((to.name || from).lastIndexOf('$') + 1)
  const toEnd = /^[a-z]{,3}$/.test(innerName) ? 'Inner' + ucFirst(innerName) : innerName
  return getMappedClassName(info, from.slice(0, from.lastIndexOf('$'))) + '$' + toEnd
}

const logged = new Set()
export function getCallStats (obj: Object) {
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

export function perf (name: string) {
  performance.mark(name + '::start')
  return () => {
    performance.mark(name + '::end')
    return performance.measure(name, name + '::start', name + '::end')
  }
}

export function errorCause (err: Error, cause: Error) {
  const linesErr = new Set(err.stack.split('\n'))
  const linesCause = cause.stack.split('\n')
  const filteredCause = linesCause.filter(line => !linesErr.has(line))
  let addStack = 'Caused by: ' + filteredCause.join('\n')
  if (filteredCause.length < linesCause.length) addStack += '\n    ...'
  err.stack += '\n' + addStack
  return err
}

export function chunkStr (str: string, size: number) {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
}
