import fs from 'mz/fs'
import path from 'path'
import { spawn, fork, spawnSync } from 'child_process'
import { sync as rmrf } from 'rimraf'
import { cpus } from 'os'

const BASE_DIR = path.resolve(__dirname, '../../base-data')
const TARGET_DIR = path.resolve('temp/guardian')
const NUM_CPUS = cpus().length
const NUM_WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS) : NUM_CPUS

export async function updateDataRepo (from, to) {
  if (!from) rmrf(TARGET_DIR)
  if (!fs.existsSync(TARGET_DIR)) await fs.mkdir(TARGET_DIR)
  rmrf(path.resolve(TARGET_DIR, '.git'))
  if (!process.env.MINECRAFT_JARS_CACHE) process.env.MINECRAFT_JARS_CACHE = path.resolve('work')
  if (!fs.existsSync(process.env.MINECRAFT_JARS_CACHE)) await fs.mkdir(process.env.MINECRAFT_JARS_CACHE)
  const commit = spawnSync('git', ['rev-parse', 'HEAD']).stdout.toString('utf8').trim()
  process.chdir(TARGET_DIR)
  await git('init')
  const versions = JSON.parse(await fs.readFile(path.resolve(BASE_DIR, 'versions.json'), 'utf8'))
    .sort((a, b) => new Date(a.releaseTime) - new Date(b.releaseTime))
  const fromIndex = from === 'none' || from === 'refresh' ? versions.length : (from ? versions.findIndex(v => v.id === from) : 0)
  const toIndex = to ? versions.findIndex(v => v.id === to) : versions.length - 1
  const processedVersions = versions.slice(Math.max(0, fromIndex), toIndex >= 0 ? toIndex + 1 : versions.length)
  console.log(`${versions.length} versions: refreshing ${fromIndex}-${toIndex} (${processedVersions.length})`)
  const queue = [...processedVersions]
  const workers = []
  for (let i = 0; i < NUM_WORKERS && i < queue.length; i++) workers.push(fork(path.resolve(__dirname, 'guardian-worker.js')))
  if (queue.length) {
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
  }
  for (const version of versions) {
    const { id, type } = version
    const versionDir = id
    if (!fs.existsSync(versionDir)) {
      console.log(`${versionDir}/ doesn't exist: skipping`)
      continue
    }
    await run('mv', [versionDir, 'src'])
    await git('add', ['src'])
    await git('commit', ['-m', id], {
      date: version.releaseTime,
      author: {
        name: 'Mojang',
        email: 'bot-rising@pvpctutorials.de'
      }
    })
    await git('tag', [id])
    await run('mv', ['src', versionDir])
  }
  await git('remote', ['add', 'origin', 'git@github.com:skyrising/guardian.git'])
  // await git('push', ['-f', '--tags', 'origin', 'master'])
}

function git (command, args = [], options = {}) {
  if (options.date) {
    if (!options.env) options.env = process.env
    const dateStr = options.date instanceof Date ? options.date.toISOString() : String(options.date)
    options.env.GIT_AUTHOR_DATE = dateStr
    options.env.GIT_COMMITTER_DATE = dateStr
  }
  if (options.author && !options.committer) options.committer = options.author
  else if (options.committer && !options.author) options.author = options.committer
  if (options.author) {
    if (!options.env) options.env = process.env
    options.env.GIT_AUTHOR_NAME = options.author.name
    options.env.GIT_AUTHOR_EMAIL = options.author.email
  }
  if (options.committer) {
    if (!options.env) options.env = process.env
    options.env.GIT_COMMITTER_NAME = options.committer.name
    options.env.GIT_COMMITTER_EMAIL = options.committer.email
  }
  return run('git', [command, ...args], options)
}

function run (command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const cp = spawn(command, args, { stdio: 'inherit', ...options })
    cp.on('error', reject)
    cp.on('exit', code => {
      if (code) reject(code)
      else resolve(code)
    })
  })
}

if (require.main === module) {
  updateDataRepo(process.argv[2], process.argv[3]).catch(console.error).then(console.log)
}
