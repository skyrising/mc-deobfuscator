import fs from 'fs'
import path from 'path'
import { sync as rmrf } from 'rimraf'
import { downloadJar, downloadObfMappings, getExtendedVersionInfo } from './version'
import { readMappings, mergeMappings, writeMappings } from './proguard'
import { stitch, cfr, enigma, fernflower, forgeflower, tinyRemapper, extractJar } from './tools'

process.on('message', async ([version]) => {
  try {
    await work(version)
    process.send({ done: true, version })
  } catch (e) {
    console.error(e)
    process.send({ error: e.stack })
  }
})

async function getFile(filename, generator) {
  const file = path.resolve(process.env.MINECRAFT_JARS_CACHE || 'work/', filename)
  if (fs.existsSync(file)) return file
  return generator(file)
}

async function getMergedMappings(version) {
  return getFile('merged-' + version.id + '.txt', async filename => {
    if (!version.downloads.client_mappings) return
    const clientMappings = await downloadObfMappings(version, 'client').catch(e => undefined)
    const serverMappings = await downloadObfMappings(version, 'server').catch(e => undefined)
    if (!clientMappings || !serverMappings) return
    const [client, server] = await Promise.all([clientMappings, serverMappings]
      .map(file => fs.createReadStream(file))
      .map(readMappings))
    await writeMappings(mergeMappings(client, server), fs.createWriteStream(filename))
    return filename
  })
}

async function getMergedJar(version) {
  return getFile('merged-' + version.id + '.jar', async filename => {
    if (!version.downloads.client || !version.downloads.server) return
    const client = await downloadJar(version, 'client').catch(e => undefined)
    const server = await downloadJar(version, 'server').catch(e => undefined)
    await stitch('mergeJar', client, server, filename)
    return filename
  })
}

async function work(version) {
    console.log(process.pid, version.id)
    version = await getExtendedVersionInfo(version)
    const mappings = await getMergedMappings(version)
    if (!mappings) return
    const jar = await getMergedJar(version)
    if (!jar) return
    rmrf(version.id)
    fs.mkdirSync(version.id)
    fs.mkdirSync(path.resolve(version.id, 'main'))
    const javaDir = path.resolve(version.id, 'main', 'java')
    // await cfr(jar, javaDir, [], '--obfuscationpath', mappings)
    const tinyMappings = mappings.replace('.txt', '.tiny')
    if (!fs.existsSync(tinyMappings)) {
      console.log(`Converting ${mappings} -> ${tinyMappings}`)
      await enigma('convert-mappings', 'proguard', mappings, 'tiny_file', tinyMappings)
    }
    const remappedJar = jar.replace('.jar', '-mapped.jar')
    console.log(`Remapping ${jar} -> ${remappedJar}`)
    await tinyRemapper(jar, remappedJar, tinyMappings, 'intermediary')
    const classesDir = path.resolve(version.id, 'main/classes')
    await extractJar(remappedJar, classesDir)
    await forgeflower(classesDir, javaDir)
    rmrf(classesDir)
    rmrf(path.resolve(javaDir, 'data'))
    rmrf(path.resolve(javaDir, 'assets'))
    rmrf(path.resolve(javaDir, 'META-INF'))
    rmrf(path.resolve(javaDir, 'javax'))
    rmrf(path.resolve(javaDir, 'joptsimple'))
    rmrf(path.resolve(javaDir, 'org'))
    if (fs.existsSync(path.resolve(javaDir, 'version.json'))) {
      const resourcesDir = path.resolve(version.id, 'main', 'resources')
      fs.mkdirSync(resourcesDir)
      fs.renameSync(path.resolve(javaDir, 'version.json'), path.resolve(resourcesDir, 'version.json'))
    }
    for (const name of fs.readdirSync(javaDir)) {
      const file = path.resolve(javaDir, name)
      if (fs.statSync(file).isFile()) fs.unlinkSync(file)
    }
}
