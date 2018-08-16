import {analyzeJar} from '../index'
import {downloadJar, getExtendedVersionInfo} from './version'

process.on('message', async ([version]) => {
  try {
    console.log(process.pid, version.id)
    version = await getExtendedVersionInfo(version)
    const client = await downloadJar(version, 'client')
    const server = await downloadJar(version, 'server')
    for (const jar of [client, server]) await analyzeJar(jar, [], {version})
    process.send({done: true})
  } catch (e) {
    console.error(e)
    process.send({error: e.stack})
  }
})
