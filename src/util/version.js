import fs from 'mz/fs'
import path from 'path'
import request from 'request-promise-native'

let manifest
export async function getManifest () {
  if (!manifest) manifest = await request('https://launchermeta.mojang.com/mc/game/version_manifest.json', {json: true})
  return manifest
}

export async function getVersionInfo (id) {
  const manifest = await getManifest()
  for (const version of manifest.versions) {
    if (version.id === id) return version
  }
}

export async function getExtendedVersionInfo (id) {
  const file = path.resolve('data', id, 'version.json')
  if (await fs.exists(file)) return JSON.parse(await fs.readFile(file, 'utf8'))
  const version = await getVersionInfo(id)
  const {downloads} = await getVersionManifest(id) || {}
  return {...version, downloads}
}

const versionManifest = {}
export async function getVersionManifest (id) {
  if (!versionManifest[id]) {
    const manifest = await getManifest()
    for (const version of manifest.versions) {
      if (version.id === id) {
        versionManifest[id] = await request(version.url, {json: true})
        break
      }
    }
  }
  return versionManifest[id]
}

export async function downloadJar (version, download = 'server') {
  const filename = (download === 'server' ? 'minecraft_server.' : '') + version + '.jar'
  const versionManifest = await getVersionManifest(version)
  if (!versionManifest) throw Error('Could not find version ' + version)
  const out = fs.createWriteStream(path.resolve('work/', filename))
  return request(versionManifest.downloads[download].url).pipe(out)
}

if (require.main === module) {
  downloadJar(process.argv[2]).then(console.log)
}
