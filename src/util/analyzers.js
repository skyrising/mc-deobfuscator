// @flow
import fs from 'mz/fs'
import path from 'path'
import { setStatus } from './status'
import { getCallStats, getMappedClassName, perf } from './index'

const dbgSearch = require('debug')('mc:deobf:search')
const debugSearch = (...args) => {
  console.debug(...args)
  dbgSearch(...args)
}

const GENERIC_ANALYZER: Analyzer = (require('../analyzers/generic'): any)
GENERIC_ANALYZER.file = 'generic.js'

export async function findAnalyzer (name: string): ?Analyzer {
  const end = perf(`findAnalyzer(${name})`)
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
        end()
        return Object.assign(require(file), { file: dir ? dir + '/' + fname : fname })
      } catch (e) {
        console.error(`Error loading analyzer ${file}: ${e}`)
      }
    }
  }
  end()
}

export async function analyzeClass (clsInfo: ClassInfo) {
  const { info } = clsInfo
  if (clsInfo.done) return
  clsInfo.done = true
  const pkg = clsInfo.obfName.includes('.') ? clsInfo.obfName.slice(0, clsInfo.obfName.lastIndexOf('.')) : ''
  if (pkg.startsWith('net.minecraft')) clsInfo.name = clsInfo.obfName
  let analyzer: Analyzer = GENERIC_ANALYZER
  const special = clsInfo.name && (clsInfo.analyzer || await findAnalyzer(getMappedClassName(info, clsInfo.obfName)))
  if (special) {
    console.log('Special analyzer for %s: %s', clsInfo.name, Object.keys(analyzer))
    clsInfo.analyzer = analyzer = special
    info.genericAnalyzed[clsInfo.obfName] = -1
  } else if (clsInfo.name) {
    console.debug('Generic analyzer for %s', clsInfo.name)
  }
  try {
    await runAnalyzer(analyzer, clsInfo, true)
  } catch (e) {
    console.error('Error while analyzing %s:\n%s', (clsInfo.name || clsInfo.obfName), e.stack)
  }
  setStatus(`Done with ${clsInfo.name || clsInfo.obfName}`)
}

const INITIALIZED_ANALYZERS: Set<Analyzer> = new Set()

export async function initAnalyzer (analyzer: Analyzer, info: FullInfo) {
  if (!INITIALIZED_ANALYZERS.has(analyzer)) {
    INITIALIZED_ANALYZERS.add(analyzer)
    if (typeof analyzer.init === 'function') {
      const end = perf(`initAnalyzer(${analyzer.name || analyzer.file || 'unknown'})`)
      console.debug('Initializing analyzer %s', analyzer.name || analyzer.file)
      if (analyzer.init) {
        /* XXX: flow doesn't know that console.debug doesn't affect analyzer.init */
        await analyzer.init(info)
      }
      end()
    }
  }
}

export async function runAnalyzer (analyzer: Analyzer, clsInfo: ClassInfo, runGeneric: boolean = false) {
  const { info } = clsInfo
  const end = perf(`runAnalyzer(${analyzer.name || analyzer.file || 'unknown'},${clsInfo.name || clsInfo.obfName})`)
  await initAnalyzer(analyzer, info)
  const className = clsInfo.obfName
  console.debug('Running analyzer %s for %s', analyzer.name || analyzer.file, clsInfo.name || className)
  if (analyzer.cls) {
    if (analyzer !== GENERIC_ANALYZER) console.debug('%s: Running analyzer.cls', clsInfo.name || className)
    setStatus(`${clsInfo.name || className}`)
    try {
      clsInfo.done = true
      if (!(await callAnalyzerClass(analyzer, clsInfo.bin, clsInfo)) && GENERIC_ANALYZER) {
        if (runGeneric) await callAnalyzerClass(GENERIC_ANALYZER, clsInfo.bin, clsInfo)
      }
    } catch (e) {
      console.error(e)
    }
  }
  if (analyzer.field) {
    for (const obfName in clsInfo.fields) {
      const fieldInfo = clsInfo.fields[obfName]
      if (fieldInfo.done || fieldInfo.name) continue
      if (analyzer !== GENERIC_ANALYZER) console.debug('%s.%s: Running analyzer.field', (clsInfo.name || className), obfName)
      setStatus(`${clsInfo.name || className}.${obfName}`)
      try {
        fieldInfo.done = true
        if (!(await callAnalyzerField(analyzer, fieldInfo.bin, fieldInfo)) && GENERIC_ANALYZER) {
          if (runGeneric) await callAnalyzerField(GENERIC_ANALYZER, fieldInfo.bin, fieldInfo)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (analyzer.method) {
    for (const methodFullSig of Object.keys(clsInfo.method)) {
      const methodInfo = clsInfo.method[methodFullSig]
      const { obfName: name, sig } = methodInfo
      if (methodInfo.done) continue
      const methodProxy = getCallStats((methodInfo: any).bin)
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
  end()
}

async function callAnalyzerClass (analyzer: Analyzer, cls: BCELClass, clsInfo: ClassInfo) {
  if (!analyzer.cls) return false
  const end = perf(`${analyzer.name || analyzer.file || 'unknown'}.cls(${clsInfo.name || clsInfo.obfName})`)
  try {
    if (analyzer.cls.length !== 1) console.warn(`${analyzer.name || analyzer.file || 'unknown'}.cls uses deprecated signature`)
    const name = analyzer.cls.length === 1 ? await analyzer.cls(clsInfo) : await analyzer.cls(cls, clsInfo, clsInfo.info)
    if (name) clsInfo.name = name
    return Boolean(name)
  } catch (e) {
    console.error(`Error analyzing ${clsInfo.name || clsInfo.obfName}: ${e}`)
  } finally {
    end()
  }
}

async function callAnalyzerMethod (analyzer: Analyzer, method: BCELMethod, methodInfo: MethodInfo) {
  if (!analyzer.method) return false
  const end = perf(`${analyzer.name || analyzer.file || 'unknown'}.method(${methodInfo.clsInfo.name || methodInfo.clsInfo.obfName}.${methodInfo.name || methodInfo.obfName}:${methodInfo.sig})`)
  try {
    if (analyzer.method.length !== 1) console.warn(`${analyzer.name || analyzer.file || 'unknown'}.method uses deprecated signature`)
    let name = analyzer.method.length === 1 ? await analyzer.method(methodInfo) : await analyzer.method((methodInfo.clsInfo: any).bin, method, methodInfo.code, methodInfo, methodInfo.clsInfo, methodInfo.info)
    if (name) methodInfo.name = name
    return Boolean(name)
  } catch (e) {
    console.error(`Error analyzing ${methodInfo.clsInfo.name || methodInfo.clsInfo.obfName}.${methodInfo.obfName}${methodInfo.sig}: ${e}`)
  } finally {
    end()
  }
}

async function callAnalyzerField (analyzer: Analyzer, field: BCELField, fieldInfo: FieldInfo) {
  if (!analyzer.field) return false
  const end = perf(`${analyzer.name || analyzer.file || 'unknown'}.field(${fieldInfo.clsInfo.name || fieldInfo.clsInfo.obfName}.${fieldInfo.name || fieldInfo.obfName}:${fieldInfo.sig})`)
  try {
    if (analyzer.field.length !== 1) console.warn(`${analyzer.name || analyzer.file || 'unknown'}.field uses deprecated signature`)
    const name = analyzer.field.length === 1 ? await analyzer.field(fieldInfo) : await analyzer.field(field, fieldInfo.clsInfo, fieldInfo.info, (fieldInfo.clsInfo: any).bin)
    if (name) fieldInfo.name = name
    return Boolean(name)
  } catch (e) {
    console.error(`Error analyzing ${fieldInfo.clsInfo.name || fieldInfo.clsInfo.obfName}.${fieldInfo.obfName}:${fieldInfo.sig}: ${e}`)
  } finally {
    end()
  }
}
