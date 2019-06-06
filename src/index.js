// @flow
import fs from 'mz/fs'
import path from 'path'
// import {graph} from './graphviz'
import { getDefaultName } from './util'
// import { readAllClasses } from './util/bcel/adapter'
import { readAllClasses } from './util/class-reader/adapter'
import { createInfo } from './util/info'
import { startStatus, endStatus } from './util/status'
import {
  specialSource as runSpecialSource,
  extractJar as runExtractJar,
  procyon, fernflower, forgeflower, cfr
} from './util/tools'
import { generateOutput } from './util/output'
import { analyzeClass, runAnalyzer, initAnalyzer } from './util/analyzers'
import { getLibraries, getMinecraftHome } from './util/version'
import { createWorkspace as createIdeaWorkspace } from './util/ide/idea'
import * as renameGetterSetter from './analyzers/getterSetter'
import * as hierarchyAnalyzer from './analyzers/hierarchy'

type Options = {
  specialSource: boolean;
  extractJar: boolean;
  debugLog: boolean;
  errorLog: boolean;
  classNameLog: boolean;
  status: boolean;
  decompile: 'procyon' | 'fernflower' | 'forgeflower' | boolean;
  ide: {
    idea: boolean;
  };
  version: Version | string;
}

let debugConsole
const dbg = require('debug')('mc:deobf')
const debug = (...args) => {
  if (debugConsole) debugConsole.log(...args)
  dbg(...args)
}
(console: any).debug = debug

function enableDebugLog () {
  if (debugConsole) return
  debugConsole = new (console: any).Console(fs.createWriteStream('debug.log'))
}

if (require.main === module) {
  enableDebugLog()
  const version = process.argv[2] || '1.12'
  const mappingsOnly = false
  const options: {...Options, version: string} = {
    specialSource: !mappingsOnly,
    extractJar: !mappingsOnly,
    debugLog: true,
    errorLog: true,
    classNameLog: true,
    status: true,

    decompile: mappingsOnly ? false : 'cfr',
    ide: {
      idea: !mappingsOnly
    },

    version
  }
  if (version.endsWith('.jar')) analyzeJar(path.resolve(version), [], options).catch(console.error)
  else analyzeClient(options).catch(console.error)
}

export async function analyzeClient (options: {...Options, version: string}) {
  const { version } = options
  console.log('Analyzing Minecraft version %s', version)
  const mcHome = getMinecraftHome()
  const versionDir = path.resolve(mcHome, 'versions', version)
  console.log('Version directory: %s', versionDir)
  const metaFile = path.resolve(versionDir, version + '.json')
  debug('Reading meta file %s', metaFile)
  const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'))
  const libraries = getLibraries(meta)
  console.log('Type: %s, Main class: %s', meta.type, meta.mainClass)
  const jarFile = path.resolve(versionDir, version + '.jar')
  return analyzeJar(jarFile, libraries, options)
}

export async function analyzeJar (jarFile: string, libraries: Array<{id: string, path: string}>, options: $Shape<Options> = {}) {
  const { specialSource, extractJar, debugLog, errorLog, classNameLog, version, status, decompile, ide }: Options = {
    specialSource: false,
    extractJar: false,
    debugLog: false,
    errorLog: false,
    classNameLog: false,
    status: false,
    version: path.basename(jarFile, '.jar').split('.').filter(p => /\d/.test(p)).join('.'),
    decompile: false,
    ide: {
      idea: false,
      ...(options.ide || {})
    },
    ...options
  }
  if (debugLog) enableDebugLog()
  if (errorLog) console.error.log = true
  libraries.push({ id: 'jsr305', path: path.resolve('work/lib/jsr305.jar') })
  const fullClassPath = [jarFile, ...libraries.map(l => l.path)]
  console.log('Class path: ' + fullClassPath.join(','))
  const side = jarFile.includes('server') ? 'server' : 'client'
  const info: FullInfo = await createInfo({ version, side, jarFile, fullClassPath, classNameLog })
  global.info = info
  const genericPasses = []
  const passClsInfo = info.newPass('reading classes', { weight: 13.5 })
  const genericWeights = [5.7, 4.1, 1.8, 1]
  // TODO: figure out if unknown fields e.g. in World are caused by not enough passes
  for (let i = 0; i < genericWeights.length; i++) genericPasses.push(info.newPass('generic[' + i + ']', { weight: genericWeights[i] }))
  const passHierarchy = info.newPass('hierarchy', { weight: 1.4 })
  const passGetterSetter = info.newPass('getters & setters', { weight: 2.2 })
  if (status) startStatus(info)
  passClsInfo.start()
  console.log('Reading classes')
  await readAllClasses(info)
  info.runScheduledTasks()
  passClsInfo.end()
  const forEachClass = (fn: (ClassInfo) => any) => Promise.all(info.classNames.map(async name => {
    try {
      await fn(info.class[name])
      if (info.currentPass) info.currentPass.analyzed++
    } catch (e) {
      console.warn(e)
    }
  }))
  await initAnalyzer(hierarchyAnalyzer, info)
  for (const pass of genericPasses) {
    pass.start()
    await forEachClass(analyzeClass)
    info.runScheduledTasks()
    pass.end()
  }
  passHierarchy.start()
  console.log('Analyzing hierarchy')
  await forEachClass(clsInfo => runAnalyzer(hierarchyAnalyzer, clsInfo))
  info.runScheduledTasks()
  passHierarchy.end()
  passGetterSetter.start()
  console.log('Renaming getters & setters')
  await forEachClass(clsInfo => runAnalyzer(renameGetterSetter, clsInfo))
  info.runScheduledTasks()
  passGetterSetter.end()
  info.runScheduledTasks(true)
  if (status) endStatus()
  // await renderGraph(info)
  const unknownClasses = ((Object.values(info.class): any): Array<ClassInfo>).filter(c => !c.name)
  console.log(info.classNames.filter(name => info.class[name].name && !info.class[name].name.endsWith(getDefaultName(info.class[name]))).length + ' class names found')
  console.log(Object.values(info.classReverse).length + ' classes packaged')
  console.log(unknownClasses.length + ' unknown classes: (Top 100)')
  console.log(unknownClasses
    .filter(c => !c.enumNames)
    .sort((a, b) => b.consts.size - a.consts.size)
    .slice(0, 100)
    .map(c => {
      const strings = [...c.consts]
      let s = c.obfName + ' lines: ' + c.numLines + ' strings: ' + strings.length
      let tc = c
      let i = 0
      while (tc.superClassName && i++ < 4) {
        const sc = info.class[tc.superClassName].name || tc.superClassName
        if (sc !== 'java.lang.Object') {
          s += ' extends ' + sc
          tc = info.class[tc.superClassName]
        } else break
      }
      s += ' ' + strings.slice(0, 10).map(s => JSON.stringify(s)).join(',').slice(0, 80)
      return s
    }).join('\n')
  )
  console.log('Enums:')
  console.log(unknownClasses
    .filter(c => c.enumNames)
    .sort(sortEnums)
    .slice(0, 100)
    .map(c => c.obfName + ': ' + c.enumNames.join(','))
    .join('\n'))
  if (specialSource) {
    const deobfJar = path.resolve('work', path.basename(jarFile, '.jar') + '-deobf.jar')
    await runSpecialSource(jarFile, deobfJar, info)
    if (extractJar) {
      const binDir = path.resolve('work/bin/')
      await runExtractJar(deobfJar, binDir)
    }
    if (decompile) {
      const wsDir = path.resolve('work/workspace')
      if (!fs.existsSync(wsDir)) fs.mkdirSync(wsDir)
      const srcDir = path.resolve(wsDir, 'src')
      switch (decompile) {
        case 'procyon':
          await procyon(deobfJar, srcDir, libraries.map(l => l.path))
          break
        case 'fernflower':
          await fernflower(deobfJar, srcDir, libraries.map(l => l.path))
          break
        case 'forgeflower':
          await forgeflower(deobfJar, srcDir, libraries.map(l => l.path))
          break
        case 'cfr':
          await cfr(deobfJar, srcDir, libraries.map(l => l.path))
          break
      }
      const workspace = {
        name: 'Minecraft ' + version.toString(),
        projects: [{
          name: side === 'server' ? 'Server' : 'Client',
          libraries,
          sources: [srcDir]
        }]
      }
      if (ide.idea) createIdeaWorkspace(wsDir, workspace)
    }
  } else {
    await generateOutput(info)
  }
}

const sortEnums = (a, b) => {
  const s0 = b.enumNames.length - a.enumNames.length
  if (s0 !== 0) return s0
  if (!a.isInnerClass && b.isInnerClass) return -1
  if (a.isInnerClass && !b.isInnerClass) return 1
  const ta = a.enumNames.toString()
  const tb = b.enumNames.toString()
  if (ta > tb) return 1
  if (ta < tb) return -1
  return 0
}
