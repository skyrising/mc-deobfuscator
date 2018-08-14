import fs from 'mz/fs'
import path from 'path'
// import {graph} from './graphviz'
import {getDefaultName} from './util'
import {enrichClsInfo} from './util/code'
import {createInfo} from './util/info'
import {startStatus, endStatus, setStatus} from './util/status'
import {specialSource, extractJar} from './util/tools'
import {getAllClasses, initJava} from './util/java'
import {analyzeClassWrapper, runAnalyzer, initAnalyzer} from './util/analyzers'
import * as renameGetterSetter from './analyzers/getterSetter'
import * as hierarchyAnalyzer from './analyzers/hierarchy'

const debugConsole = new console.Console(fs.createWriteStream('debug.log'))
const dbg = require('debug')('mc:deobf')
const debug = (...args) => {
  debugConsole.log(...args)
  dbg(...args)
}
console.debug = debug

const version = process.argv[2] || '1.12'
if (version.endsWith('.jar')) analyzeJar(path.resolve(version), []).catch(console.error)
else analyzeVersion(version).catch(console.error)

async function analyzeVersion (version) {
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
  return analyzeJar(jarFile, classPath)
}

async function analyzeJar (jarFile, classPath) {
  const fullClassPath = [jarFile, ...classPath]
  console.log('Class path: ' + fullClassPath)
  const Repository = await initJava(fullClassPath)
  const classNames = getAllClasses(jarFile).filter(name => !name.includes('/') || name.startsWith('net/minecraft'))
  const forEachClass = fn => Promise.all(classNames.map(async name => {
    try {
      const cls = await Repository.lookupClass(name)
      const clsInfo = info.class[name]
      await fn(cls, clsInfo)
    } catch (e) {
      console.warn(e)
    }
  }))
  console.log(classNames.length + ' classes, ' + classNames.filter(name => !name.includes('$')).length + ' outer classes')
  const side = jarFile.includes('server') ? 'server' : 'client'
  const version = path.basename(jarFile, '.jar').split('.').filter(p => /\d/.test(p)).join('.')
  const info = await createInfo({version, side, classNames})
  startStatus(info)
  console.log('Enriching class info')
  await forEachClass(cls => enrichClsInfo(cls, info))
  await initAnalyzer(hierarchyAnalyzer, info)
  const ps = {}
  while (true) {
    while (info.hasWork) {
      const name = info.dequeue()
      ps[name] = analyzeClassWrapper(name, info, Repository)
    }
    setStatus('Starting pass')
    info.analyzing = ps
    await Promise.all(Object.values(ps))
    if (!info.hasWork) break
  }
  console.log('Queue empty')
  console.log('Analyzing hierarchy')
  await forEachClass((cls, clsInfo) => runAnalyzer(hierarchyAnalyzer, cls, clsInfo, info))
  console.log('Renaming getters & setters')
  await forEachClass((cls, clsInfo) => runAnalyzer(renameGetterSetter, cls, clsInfo, info))
  endStatus()
  const deobfJar = path.resolve('work', path.basename(jarFile, '.jar') + '-deobf.jar')
  // await renderGraph(info)
  const unknownClasses = Object.values(info.class).filter(c => !c.name)
  console.log(Object.values(info.classReverse).filter(name => !info.class[name].name.endsWith(getDefaultName(info.class[name]))).length + ' class names found')
  console.log(Object.values(info.classReverse).length + ' classes packaged')
  await specialSource(jarFile, deobfJar, info)
  console.log('Max parallel: %d, avg time %dms/class (sum: %dms)', info.maxParallel, Math.round(info.classAnalyzeAvg), Math.round(info.classAnalyzeAvg * info.numAnalyzed))
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
    .map(c => c.obfName + ': ' + c.enumNames)
    .join('\n'))
  const binDir = path.resolve('./work/bin/')
  await extractJar(deobfJar, binDir)
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
