import fs from 'mz/fs'
import path from 'path'
import {spawn, fork} from 'child_process'
import {sync as rmrf} from 'rimraf'
import {cpus} from 'os'

const BASE_DIR = path.resolve(__dirname, '../../base-data')
const TARGET_DIR = path.resolve('temp/mc-data')
const NUM_CPUS = cpus().length
const NUM_WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS) : NUM_CPUS

export async function updateDataRepo () {
  rmrf(TARGET_DIR)
  await fs.mkdir(TARGET_DIR)
  const DATA_DIR = path.resolve(TARGET_DIR, 'data')
  if (!process.env.MINECRAFT_JARS_CACHE) process.env.MINECRAFT_JARS_CACHE = path.resolve('work')
  if (!fs.existsSync(process.env.MINECRAFT_JARS_CACHE)) await fs.mkdir(process.env.MINECRAFT_JARS_CACHE)
  if (!fs.existsSync(DATA_DIR)) await fs.mkdir(DATA_DIR)
  process.chdir(TARGET_DIR)
  await run('git', ['init'])
  await run('cp', [path.resolve(BASE_DIR, 'README.md'), '.'])
  await run('git', ['add', '.'])
  await run('git', ['commit', '-m', 'base'])
  const versions = JSON.parse(await fs.readFile(path.resolve(BASE_DIR, 'versions.json'), 'utf8'))
  .sort((a, b) => new Date(a.releaseTime) - new Date(b.releaseTime))
  const queue = [...versions]
  const workers = []
  for (let i = 0; i < NUM_WORKERS && i < queue.length; i++) workers.push(fork(path.resolve(__dirname, 'worker.js')))
  await new Promise((resolve, reject) => {
    let done = 0
    for (const worker of workers) {
      worker.on('message', msg => {
        if (msg.error) {
          for (const w of workers) w.kill()
          reject(msg.error)
        } else if (msg.done) {
          if (queue.length) worker.send([queue.shift()])
          else {
            done++
            if (done === workers.length) resolve()
            worker.kill()
          }
        }
      })
    }
    for (const worker of workers) {
      worker.send([queue.shift()])
    }
  })
  for (const version of versions) {
    const {id} = version
    await run('mv', [path.resolve(DATA_DIR, id), id])
    rmrf('latest')
    await run('cp', ['-r', id, 'latest'])
    await run('git', ['add', id])
    await run('git', ['add', 'latest'])
    await run('git', ['commit', '--date', version.releaseTime, '-m', id])
    await run('git', ['tag', id])
  }
  await run('git', ['remote', 'add', 'origin', 'git@github.com:skyrising/mc-data.git'])
  await run('git', ['push', '-f', '--tags', 'origin', 'master'])
}

function run (command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const cp = spawn(command, args, {stdio: 'inherit', ...options})
    cp.on('error', reject)
    cp.on('exit', code => {
      if (code) reject(code)
      else resolve(code)
    })
  })
}

if (require.main === module) {
  updateDataRepo().catch(console.error).then(console.log)
}
