// @flow
import fs from 'mz/fs'
import path from 'path'
// import {graph} from './graphviz'
import {getDefaultName} from './util'
import {enrichClsInfo} from './util/code'
import {createInfo} from './util/info'
import {startStatus, endStatus} from './util/status'
import {specialSource as runSpecialSource, extractJar as runExtractJar} from './util/tools'
import {generateOutput} from './util/output'
import {getAllClasses, initJava} from './util/java'
import {analyzeClassWrapper, runAnalyzer, initAnalyzer} from './util/analyzers'
import * as renameGetterSetter from './analyzers/getterSetter'
import * as hierarchyAnalyzer from './analyzers/hierarchy'

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
  const options = {
    specialSource: true,
    extractJar: true,
    debugLog: true,
    errorLog: true,
    status: true
  }
  if (version.endsWith('.jar')) analyzeJar(path.resolve(version), [], options).catch(console.error)
  else analyzeVersion(version, options).catch(console.error)
}

export async function analyzeVersion (version, options) {
  console.log('Analyzing Minecraft version %s', version)
  const versionDir = path.resolve(process.env.HOME, '.minecraft/versions', version)
  console.log('Version directory: %s', versionDir)
  const metaFile = path.resolve(versionDir, version + '.json')
  debug('Reading meta file %s', metaFile)
  const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'))
  const classPath = [...new Set(meta.libraries.map(l => {
    const file = l.name.split(':')[0].replace(/\./g, '/').replace(/:/g, '/')
    const fn = l.name.split(':')
    return path.resolve(process.env.HOME, '.minecraft/libraries/' + file + '/' + fn[1] + '/' + fn[2] + '/' + fn[1] + '-' + fn[2] + '.jar')
  }))]
  console.log('Type: %s, Main class: %s', meta.type, meta.mainClass)
  const jarFile = path.resolve(versionDir, version + '.jar')
  return analyzeJar(jarFile, classPath, options)
}

type Options = {
  specialSource: boolean;
  extractJar: boolean;
  debugLog: boolean;
  errorLog: boolean;
  status: boolean;
  version: Version | string;
}

export async function analyzeJar (jarFile: string, classPath: Array<string>, options: $Shape<Options> = {}) {
  const {specialSource, extractJar, debugLog, errorLog, version, status}: Options = {
    specialSource: false,
    extractJar: false,
    debugLog: false,
    errorLog: false,
    status: false,
    version: path.basename(jarFile, '.jar').split('.').filter(p => /\d/.test(p)).join('.'),
    ...options
  }
  if (debugLog) enableDebugLog()
  if (errorLog) console.error.log = true
  const fullClassPath = [jarFile, ...classPath]
  console.log('Class path: ' + fullClassPath.join(','))
  const Repository = await initJava(fullClassPath)
  const classNames = getAllClasses(jarFile).filter(name => !name.includes('.') || name.startsWith('net.minecraft'))
  const forEachClass = (fn: (BCELClass, ClassInfo) => any) => Promise.all(classNames.map(async name => {
    try {
      const cls = await Repository.lookupClass(name)
      const clsInfo = info.class[name]
      await fn(cls, clsInfo)
      if (info.currentPass) info.currentPass.analyzed++
    } catch (e) {
      console.warn(e)
    }
  }))
  console.log(classNames.length + ' classes, ' + classNames.filter(name => !name.includes('$')).length + ' outer classes')
  const side = jarFile.includes('server') ? 'server' : 'client'
  const info: FullInfo = await createInfo({version, side, classNames})
  global.info = info
  const genericPasses = []
  const passClsInfo = info.newPass('reading classes', {weight: 2})
  for (let i = 0; i < 3; i++) genericPasses.push(info.newPass('generic[' + i + ']'))
  const passHierarchy = info.newPass('hierarchy', {weight: 0.3})
  const passGetterSetter = info.newPass('getters & setters', {weight: 0.6})
  if (status) startStatus(info)
  passClsInfo.start()
  console.log('Reading classes')
  await forEachClass(cls => enrichClsInfo(cls, info))
  passClsInfo.end()
  await initAnalyzer(hierarchyAnalyzer, info)
  for (const pass of genericPasses) {
    pass.start()
    await forEachClass(cls => analyzeClassWrapper(cls, info, Repository))
    pass.end()
  }
  passHierarchy.start()
  console.log('Analyzing hierarchy')
  await forEachClass((cls, clsInfo) => runAnalyzer(hierarchyAnalyzer, clsInfo))
  passHierarchy.end()
  passGetterSetter.start()
  console.log('Renaming getters & setters')
  await forEachClass((cls, clsInfo) => runAnalyzer(renameGetterSetter, clsInfo))
  passGetterSetter.end()
  if (status) endStatus()
  // await renderGraph(info)
  const unknownClasses = ((Object.values(info.class): any): Array<ClassInfo>).filter(c => !c.name)
  console.log(classNames.filter(name => info.class[name].name && !info.class[name].name.endsWith(getDefaultName(info.class[name]))).length + ' class names found')
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
      const binDir = path.resolve('./work/bin/')
      await runExtractJar(deobfJar, binDir)
    }
  } else {
    await generateOutput(info)
  }
  // const srcDir = path.resolve('./work/src/')
  // await procyon(deobfJar, srcDir)
  // await fernflower(deobfJar, srcDir)
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
