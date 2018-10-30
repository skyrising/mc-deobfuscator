// @flow
import * as PKG from '../PackageNames'
import fs from 'fs'
import path from 'path'
import { getMappedClassName, sortObfClassName, slash } from './index'
import { digraph } from './graphviz'

export function generateOutput (info: FullInfo) {
  const dataDir = path.resolve('data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
  const versionDir = path.resolve(dataDir, info.version.toString())
  if (!fs.existsSync(versionDir)) fs.mkdirSync(versionDir)
  const version = path.resolve(versionDir, 'version.json')
  fs.writeFileSync(version, JSON.stringify(info.version, null, 2))
  const sideDir = path.resolve(versionDir, info.side)
  if (!fs.existsSync(sideDir)) fs.mkdirSync(sideDir)
  const srg = path.resolve(sideDir, 'mapping.srg')
  generateSrg(info, srg)
  const tsrg = path.resolve(sideDir, 'mapping.tsrg')
  generateTsrg(info, tsrg)
  const obfClasses = path.resolve(sideDir, 'classes-obf.txt')
  const deobfClasses = path.resolve(sideDir, 'classes-deobf.txt')
  const hashClasses = path.resolve(sideDir, 'class-hashes.txt')
  generateClassLists(info, obfClasses, deobfClasses, hashClasses)
  const inheritanceGraph = path.resolve(sideDir, 'inheritance.dot')
  renderGraph(info, inheritanceGraph)
  const dataFiles = generateDataFiles(info, sideDir)
  console.log(version)
  console.log(srg)
  console.log(tsrg)
  console.log(obfClasses)
  console.log(deobfClasses)
  console.log(hashClasses)
  console.log(inheritanceGraph)
  for (const file of dataFiles) console.log(file)
  return { version, srg, tsrg, obfClasses, deobfClasses, hashClasses, dataFiles, inheritanceGraph }
}

export function generateClassLists (info: FullInfo, obfFile: string, deobfFile: string, hashFile: string) {
  const obfClasses = info.classNames.sort(sortObfClassName)
  const deobfClasses = obfClasses.map(cls => getMappedClassName(info, cls)).filter(Boolean)
  const hashCount = {}
  const hashIndex = {}
  for (const cls of obfClasses) {
    const hash = info.class[cls].hashBase26
    hashIndex[hash] = 0
    hashCount[hash] = (hashCount[hash] || 0) + 1
  }
  const hashClasses = obfClasses.map(cls => {
    const hash = info.class[cls].hashBase26
    return hashCount[hash] > 1 ? hash + hashIndex[hash]++ : hash
  })
  fs.writeFileSync(obfFile, obfClasses.map(cls => cls + '\n').join(''))
  fs.writeFileSync(deobfFile, deobfClasses.map(cls => cls + '\n').join(''))
  fs.writeFileSync(hashFile, hashClasses.map(cls => cls + '\n').join(''))
}

export function generateSrg (info: FullInfo, srgFile: string, sort: boolean = false) {
  let srg = [
    'PK: . ' + slash(PKG.DEFAULT),
    'PK: net net',
    'PK: ' + slash(PKG.BASE) + ' ' + slash(PKG.BASE),
    'PK: ' + slash(PKG.CLIENT) + ' ' + slash(PKG.CLIENT),
    'PK: net/minecraft/client/main net/minecraft/client/main',
    'PK: net/minecraft/realms net/minecraft/realms',
    'PK: net/minecraft/server net/minecraft/server',
    'PK: net/minecraft/data net/minecraft/data'
  ]
  for (const from of info.classNames) {
    const to = info.class[from]
    const toName = getMappedClassName(info, from)
    if (toName) srg.push(`CL: ${slash(from)} ${slash(toName)}`)
    for (const fd in to.fields) srg.push(`FD: ${slash(from)}/${fd} ${slash(toName)}/${to.fields[fd].bestName}`)
    for (const mdFrom in to.method) {
      const md = to.method[mdFrom]
      if (md.name) srg.push(`MD: ${slash(from)}/${md.origName} ${md.sig} ${slash(toName)}/${md.bestName} ${md.sig}`)
    }
  }
  if (sort) {
    const sectionOrder = ['PK:', 'CL:', 'FD:', 'MD:']
    srg = srg.sort((a, b) => {
      const colsA = a.split(' ')
      const colsB = b.split(' ')
      if (colsA[0] !== colsB[0]) return sectionOrder.indexOf(colsA[0]) - sectionOrder.indexOf(colsB[0])
      const [clsA, clsB] = colsA[1].includes('/')
        ? [colsA[1].slice(0, colsA[1].indexOf('/')), colsB[1].slice(0, colsB[1].indexOf('/'))]
        : [colsA[1], colsB[1]]
      const cmpCls = sortObfClassName(clsA, clsB)
      if (cmpCls !== 0) return cmpCls
      if (a > b) return 1
      if (a < b) return -1
      return 0
    })
  }
  fs.writeFileSync(srgFile, srg.join('\n'))
}

export function generateTsrg (info: FullInfo, tsrgFile: string) {
  const lines = []
  for (const from of info.classNames) {
    const to = info.class[from]
    const toName = getMappedClassName(info, from)
    lines.push(slash(from) + ' ' + slash(toName))
    for (const fd in to.fields) lines.push(`\t${fd} ${to.fields[fd].bestName}`)
    for (const mdFrom in to.method) {
      const md = to.method[mdFrom]
      lines.push(`\t${md.origName} ${md.sig} ${md.bestName}`)
    }
  }
  fs.writeFileSync(tsrgFile, lines.join('\n'))
}

export function generateDataFiles (info: FullInfo, dir: string) {
  const files = []
  for (const basename in info.data) {
    let data
    if (typeof info.data[basename].post === 'function') {
      const post = info.data[basename].post
      delete info.data[basename].post
      post.call(info.data[basename])
    }
    if (Array.isArray(info.data[basename])) data = info.data[basename].sort()
    else {
      data = {}
      for (const key of Object.keys(info.data[basename]).sort()) data[key] = info.data[basename][key]
    }
    const file = path.resolve(dir, basename + '.json')
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    files.push(file)
  }
  return files
}

export function renderGraph (info: FullInfo, file: string) {
  const g = digraph({
    fontname: 'sans-serif',
    overlap: false,
    splines: true,
    rankdir: 'LR',
    size: '25,25',
    pack: 16
  })
  g.nodeAttributes = {
    fontname: 'sans-serif',
    shape: 'Mrecord'
  }
  g.edgeAttributes = {
    fontname: 'sans-serif'
  }
  const sgs = {}
  const getSubgraph = name => {
    if (!name || name.startsWith(PKG.DEFAULT)) return g
    if (name in sgs) return sgs[name]
    const p = name.indexOf('.') === -1 ? g : getSubgraph(name.slice(0, name.lastIndexOf('.')))
    const sg = p.subgraph({ name: JSON.stringify('cluster_' + name) })
    sgs[name] = sg
    return sg
  }
  for (const obfName of info.classNames) {
    const clsInfo = info.class[obfName]
    const inheritsFrom = [clsInfo.superClassName, ...clsInfo.interfaceNames]
      .filter(c => c && c !== 'java.lang.Object' && c !== 'java.lang.Enum')
    if (inheritsFrom.length === 0 && clsInfo.subClasses.size === 0) continue
    const name = getMappedClassName(clsInfo).replace(/\//g, '.')
    const s = name.indexOf('.') > 0 ? getSubgraph(name.slice(0, name.lastIndexOf('.'))) : g
    const type = clsInfo.flags.interface
      ? 'interface'
      : (clsInfo.superClassName === 'java.lang.Enum'
        ? 'enum'
        : (clsInfo.flags.abstract ? 'abstract class' : 'class')
      )
    const label = `${type} | {${obfName} | ${name.replace(PKG.BASE + '.', '')}}`
    const color = ({
      interface: '#83b6c3',
      enum: '#5ac380',
      class: '#d6c6a8',
      'abstract class': '#d6d6b5'
    })[type]
    const attr = {
      name: JSON.stringify(obfName),
      label,
      fillcolor: color
    }
    if (clsInfo.flags.interface) attr.fontsize = 16
    if (clsInfo.isInnerClass) attr.fontsize = 12
    if (inheritsFrom.length === 0) {
      attr.root = true
      attr.fontsize = 20
    }
    attr.fontsize += Math.floor(clsInfo.subClasses.size / 10)
    s.node(attr)
    for (const sc of inheritsFrom) g.edge(JSON.stringify(obfName), JSON.stringify(sc), {})
  }
  // g.killOrphans()
  fs.writeFileSync(file, g.toString())
}
