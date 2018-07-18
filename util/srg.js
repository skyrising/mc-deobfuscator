import * as PKG from '../PackageNames'
import fs from 'fs'
import path from 'path'
import {getMappedClassName, sortObfClassName} from './index'

export function generateSrgs (info) {
  const dataDir = path.resolve(__dirname, '../data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
  const versionDir = path.resolve(dataDir, info.version)
  if (!fs.existsSync(versionDir)) fs.mkdirSync(versionDir)
  const sideDir = path.resolve(versionDir, info.side)
  if (!fs.existsSync(sideDir)) fs.mkdirSync(sideDir)
  const srg = path.resolve(sideDir, 'mapping.srg')
  generateSrg(info, srg)
  const obfClasses = path.resolve(sideDir, 'classes-obf.txt')
  const deobfClasses = path.resolve(sideDir, 'classes-deobf.txt')
  generateClassLists(info, obfClasses, deobfClasses)
  return {srg, obfClasses, deobfClasses}
}

export function generateClassLists (info, obfFile, deobfFile) {
  const obfClasses = info.classNames.sort(sortObfClassName)
  const deobfClasses = obfClasses.map(cls => getMappedClassName(info, cls)).filter(Boolean)
  fs.writeFileSync(obfFile, obfClasses.map(cls => cls + '\n').join(''))
  fs.writeFileSync(deobfFile, deobfClasses.map(cls => cls + '\n').join(''))
}

export function generateSrg (info, srgFile) {
  const slash = s => s.replace(/\./g, '/')
  const srg = [
    'PK: . ' + slash(PKG.DEFAULT),
    'PK: net net',
    'PK: ' + slash(PKG.BASE) + ' ' + slash(PKG.BASE),
    'PK: ' + slash(PKG.CLIENT) + ' ' + slash(PKG.CLIENT),
    'PK: net/minecraft/client/main net/minecraft/client/main',
    'PK: net/minecraft/realms net/minecraft/realms',
    'PK: net/minecraft/server net/minecraft/server',
    'PK: net/minecraft/data net/minecraft/data'
  ]
  for (const from in info.class) {
    const to = info.class[from]
    const toName = getMappedClassName(info, from)
    if (toName) srg.push(`CL: ${slash(from)} ${slash(toName)}`)
    for (const fd in to.field) srg.push(`FD: ${slash(from)}/${fd} ${slash(toName)}/${to.field[fd]}`)
    for (const mdFrom in to.method) {
      const md = to.method[mdFrom]
      if (md.name) srg.push(`MD: ${slash(from)}/${md.origName} ${md.sig} ${slash(toName)}/${md.name} ${md.sig}`)
    }
  }
  const sectionOrder = ['PK:', 'CL:', 'FD:', 'MD:']
  fs.writeFileSync(srgFile, srg.sort((a, b) => {
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
  }).join('\n'))
}
