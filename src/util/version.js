// @flow
import fs from 'mz/fs'
import os from 'os'
import path from 'path'
import request0 from 'request'
import request from 'request-promise-native'

let manifest
export async function getManifest () {
  if (!manifest) manifest = await request('https://launchermeta.mojang.com/mc/game/version_manifest.json', { json: true })
  return manifest
}

export async function getVersionInfo (id) {
  const manifest = await getManifest()
  for (const version of manifest.versions) {
    if (version.id === id) return version
  }
}

export async function getExtendedVersionInfo (id) {
  if (typeof id === 'object') {
    const { downloads } = await getVersionManifest(id) || {}
    return { ...id, downloads }
  }
  const file = path.resolve('data', id, 'version.json')
  if (await fs.exists(file)) return JSON.parse(await fs.readFile(file, 'utf8'))
  const version = await getVersionInfo(id)
  const { downloads } = await getVersionManifest(id) || {}
  return { ...version, downloads }
}

const versionManifest = {}
export async function getVersionManifest (id) {
  if (!versionManifest[id.id || id]) {
    if (id.url) {
      versionManifest[id.id] = await request(id.url, { json: true })
      return versionManifest[id.id]
    }
    const manifest = await getManifest()
    for (const version of manifest.versions) {
      if (version.id === id) {
        versionManifest[id] = await request(version.url, { json: true })
        break
      }
    }
  }
  return versionManifest[id.id || id]
}

export async function downloadJar (version, download = 'server') {
  const filename = (download === 'server' ? 'minecraft_server.' : '') + (version.id || version) + '.jar'
  const file = path.resolve(process.env.MINECRAFT_JARS_CACHE || 'work/', filename)
  if (await fs.exists(file)) return file
  const versionManifest = typeof version === 'object' ? version : await getVersionManifest(version)
  if (!versionManifest) throw Error('Could not find version ' + version)
  const out = fs.createWriteStream(file)
  return new Promise((resolve, reject) => {
    request0(versionManifest.downloads[download].url).on('error', reject).on('end', () => resolve(file)).pipe(out)
  })
}

export async function addVersion (info) {
  if (typeof info === 'object') {
    const newVersions = info.versions || (Array.isArray(info) ? info : [info])
    const versions = {}
    const oldVersions = JSON.parse(await fs.readFile('base-data/versions.json', 'utf8'))
    for (const v of oldVersions) versions[v.id] = v
    for (const v of newVersions) versions[v.id] = v
    const numNew = Object.keys(versions).length - oldVersions.length
    const numChanged = newVersions.length - numNew
    console.log(`Added ${numNew} versions${numChanged ? ` (${numChanged} updated)` : ''}`)
    await fs.writeFile('base-data/versions.json', JSON.stringify(Object.values(versions)
      .sort((a, b) => new Date(b.releaseTime) - new Date(a.releaseTime))
      .map(({ id, type, releaseTime, url }) => ({ id, type, releaseTime, url })), null, 2))
  } else {
    await addVersion({ ...await request(info, { json: true }), info })
  }
}

/*
export function getLibraries (meta) {
  return [...new Set(meta.libraries.map(l => {
    const file = l.name.split(':')[0].replace(/\./g, '/').replace(/:/g, '/')
    const fn = l.name.split(':')
    return path.resolve(getMinecraftHome(), 'libraries/' + file + '/' + fn[1] + '/' + fn[2] + '/' + fn[1] + '-' + fn[2] + '.jar')
  }))]
}
*/

export function getLibraries (meta: {libraries: Array<{name: string, downloads: {artifact: {path: string}}}>}): Array<{id: string, path: string}> {
  const libDir = path.resolve(getMinecraftHome(), 'libraries')
  return meta.libraries.filter(lib => {
    if (!lib.downloads.artifact || !lib.downloads.artifact.path) return false
    if (!lib.rules) return true
    for (const rule of lib.rules) {
      const result = testRule(rule)
      if (result && rule.action === 'disallow') return false
      if (!result && rule.action === 'allow') return false
    }
  }).map(l => ({
    id: l.name,
    path: path.resolve(libDir, l.downloads.artifact.path)
  }))
}

type Rule = {
  os?: {name: string};
}

function testRule (rule: Rule) {
  if (rule.os) {
    const expected = rule.os.name
    const pf = os.platform()
    if (pf === 'darwin') return expected === 'osx'
    if (pf === 'windows') return expected === 'win32'
    return expected === os
  }
}

/* eslint-disable no-return-assign */
let _mcHome
export function getMinecraftHome () {
  if (_mcHome) return _mcHome
  switch (os.platform()) {
    case 'win32': return _mcHome = path.resolve('%APPDATA%\\.minecraft')
    case 'darwin': return _mcHome = path.resolve(process.env.HOME || '.', 'Library/Application Support/minecraft')
    default: return _mcHome = path.resolve(process.env.HOME || '.', '.minecraft')
  }
}
/* eslint-enable no-return-assign */

if (require.main === module) {
  (async () => {
    try {
      if (process.argv[2] === 'add') {
        await addVersion(process.argv[3])
      } else {
        await downloadJar(process.argv[2])
      }
    } catch (e) {
      console.error(e)
    }
  })()
}
