import fs from 'fs'
import path from 'path'
import request from 'request-promise-native'

export function getManifest () {
  return request('https://launchermeta.mojang.com/mc/game/version_manifest.json', {json: true})
}

export async function getVersionManifest (id) {
  const manifest = await getManifest()
  for (const version of manifest.versions) {
    if (version.id === id) {
      return request(version.url, {json: true})
    }
  }
}

export async function downloadJar (version, download = 'server') {
  const filename = (download === 'server' ? 'minecraft_server.' : '') + version + '.jar'
  const versionManifest = await getVersionManifest(version)
  if (!versionManifest) throw Error('Could not find version ' + version)
  const out = fs.createWriteStream(path.resolve(__dirname, '../work/', filename))
  return request(versionManifest.downloads[download].url).pipe(out)
}

downloadJar('1.13-pre8').then(console.log)
