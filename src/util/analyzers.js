import fs from 'mz/fs'
import path from 'path'
import {setStatus} from './status'
import {getCallStats, waiter, getMappedClassName} from './index'
import {enrichClsInfo} from './code'

const dbgSearch = require('debug')('mc:deobf:search')
const debugSearch = (...args) => {
  console.debug(...args)
  dbgSearch(...args)
}

const GENERIC_ANALYZER = require('../analyzers/generic')
GENERIC_ANALYZER.file = 'generic.js'

export async function findAnalyzer (name) {
  debugSearch('Searching for analyzer for %s', name)
  const parts = name.replace(/\//g, '.').split('.')
  for (let i = 1; i <= parts.length; i++) {
    const fname = parts.slice(-i).join('.') + '.js'
    const dir = parts.slice(0, -i).join('/')
    const file = path.resolve(__dirname, '../analyzers', dir, fname)
    const exists = await fs.exists(file)
    debugSearch('Checking %s: %s', file, exists ? 'exists' : `doesn't exist`)
    if (exists) {
      try {
        return Object.assign(require(file), {file: dir ? dir + '/' + fname : fname})
      } catch (e) {
        console.log(e.message)
      }
    }
  }
}

export async function analyzeClassWrapper (next, info, Repository) {
  let w = waiter()
  const start = Date.now()
  if (typeof next === 'string') {
    info.class[next].analyzing = w
    try {
      next = await Repository.lookupClass(next)
    } catch (e) {
      console.warn('Could not load class ' + next)
      return
    }
  } else {
    info.class[next.getClassName()].analyzing = w
  }
  info.maxParallel = Math.max(info.maxParallel, ++info.running)
  w.waitingFor = analyzeClass(next, info)
  return w.then(() => {
    info.running--
    const sum = info.classAnalyzeAvg * info.numAnalyzed + (Date.now() - start)
    info.classAnalyzeAvg = sum / ++info.numAnalyzed
  })
}

export async function analyzeClass (cls, info) {
  const clsInfo = await enrichClsInfo(cls, info)
  if (clsInfo.done) return
  clsInfo.done = true
  const pkg = cls.getPackageName()
  if (pkg.startsWith('net.minecraft')) clsInfo.name = clsInfo.obfName
  let analyzer = GENERIC_ANALYZER
  const special = clsInfo.name && (clsInfo.analyzer || await findAnalyzer(getMappedClassName(info, clsInfo.obfName)))
  if (special) {
    console.log('Special analyzer for %s: %s', clsInfo.name, Object.keys(analyzer))
    clsInfo.analyzer = analyzer = special
    info.genericAnalyzed[clsInfo.obfName] = -1
  } else if (clsInfo.name) {
    console.debug('Generic analyzer for %s', clsInfo.name)
  }
  try {
    await runAnalyzer(analyzer, cls, clsInfo, info, GENERIC_ANALYZER)
  } catch (e) {
    console.error('Error while analyzing %s:\n%s', (clsInfo.name || clsInfo.obfName), e.stack)
  }
  setStatus(`Done with ${clsInfo.name || clsInfo.obfName}`)
}

const INITIALIZED = Symbol('initialized')

export async function initAnalyzer (analyzer, info) {
  if (!analyzer[INITIALIZED]) {
    analyzer[INITIALIZED] = true
    if (typeof analyzer.init === 'function') {
      console.debug('Initializing analyzer %s', analyzer.name || analyzer.file)
      await analyzer.init(info)
    }
  }
}

export async function runAnalyzer (analyzer, cls, clsInfo, info, runGeneric) {
  await initAnalyzer(analyzer, info)
  const className = clsInfo.obfName
  console.debug('Running analyzer %s for %s', analyzer.name || analyzer.file, clsInfo.name || className)
  if (analyzer.cls) {
    if (analyzer !== GENERIC_ANALYZER) console.debug('%s: Running analyzer.cls', clsInfo.name || className)
    setStatus(`${clsInfo.name || className}`)
    try {
      const name = await analyzer.cls(cls, clsInfo, info)
      if (name) clsInfo.name = name
    } catch (e) {
      console.error(e)
    }
  }
  if (analyzer.field) {
    for (const field of await cls.getFieldsAsync()) {
      const fieldProxy = field// getCallStats(field)
      const obfName = await field.getNameAsync()
      if (clsInfo.field[obfName]) continue
      clsInfo.field[obfName] = null
      if (analyzer !== GENERIC_ANALYZER) console.debug('%s.%s: Running analyzer.field', (clsInfo.name || className), obfName)
      setStatus(`${clsInfo.name || className}.${obfName}`)
      try {
        const deobfName = await analyzer.field(fieldProxy, clsInfo, info, cls)
        if (deobfName) {
          clsInfo.field[obfName] = deobfName
          clsInfo.done = false
        } else if (GENERIC_ANALYZER && analyzer !== GENERIC_ANALYZER) {
          const deobfName = await GENERIC_ANALYZER.field(fieldProxy, clsInfo, info, cls)
          if (deobfName) clsInfo.field[obfName] = deobfName
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (analyzer.method) {
    for (const method of await cls.getMethodsAsync()) {
      const methodProxy = getCallStats(method)
      const name = await method.getNameAsync()
      const sig = await method.getSignatureAsync()
      const methodInfo = clsInfo.method[name + ':' + sig]
      if (methodInfo.done) continue
      if (analyzer !== GENERIC_ANALYZER) console.debug('Analyzing method %s.%s:%s', (clsInfo.name || className), name, sig)
      setStatus(`${clsInfo.name || className}.${name}${sig}`)
      try {
        methodInfo.done = true
        if (!(await callAnalyzerMethod(analyzer, methodProxy, methodInfo)) && GENERIC_ANALYZER) {
          if (runGeneric) await callAnalyzerMethod(GENERIC_ANALYZER, methodProxy, methodInfo)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
}

async function callAnalyzerMethod (analyzer, method, methodInfo) {
  if (analyzer.method.length === 1) {
    const name = await analyzer.method(methodInfo)
    if (name) methodInfo.name = name
    return Boolean(name)
  }
  const name = await analyzer.method(methodInfo.clsInfo.bin, method, methodInfo.code, methodInfo, methodInfo.clsInfo, methodInfo.clsInfo.info)
  if (name) methodInfo.name = name
  return Boolean(name)
}
