import fs from 'mz/fs'
import path from 'path'
import { spawn, fork, spawnSync } from 'child_process'
import { sync as rmrf } from 'rimraf'
import { cpus } from 'os'

const BASE_DIR = path.resolve(__dirname, '../../base-data')
const TARGET_DIR = path.resolve('temp/mc-data')
const NUM_CPUS = cpus().length
const NUM_WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS) : NUM_CPUS

async function writeREADME (dest, commit, version) {
  const COMMIT = commit
  const COMMIT_SHORT = COMMIT.slice(0, 7)
  let readme = `# mc-data
  ![GitHub repo size in bytes](https://img.shields.io/github/repo-size/skyrising/mc-data.svg)

  Data generated/extracted by [mc-deobfuscator](https://github.com/skyrising/mc-deobfuscator)`
  if (version) readme += ` [${COMMIT_SHORT}](https://github.com/skyrising/mc-deobfuscator/commit/${COMMIT})`
  readme += '\n'
  await fs.writeFile(dest, readme)
}

export async function updateDataRepo (from, to) {
  if (!from) rmrf(TARGET_DIR)
  if (!fs.existsSync(TARGET_DIR)) await fs.mkdir(TARGET_DIR)
  rmrf(path.resolve(TARGET_DIR, '.git'))
  const DATA_DIR = path.resolve(TARGET_DIR, 'data')
  if (!process.env.MINECRAFT_JARS_CACHE) process.env.MINECRAFT_JARS_CACHE = path.resolve('work')
  if (!fs.existsSync(process.env.MINECRAFT_JARS_CACHE)) await fs.mkdir(process.env.MINECRAFT_JARS_CACHE)
  if (!fs.existsSync(DATA_DIR)) await fs.mkdir(DATA_DIR)
  const commit = spawnSync('git', ['rev-parse', 'HEAD']).stdout.toString('utf8').trim()
  process.chdir(TARGET_DIR)
  await git('init')
  await writeREADME('README.md', commit)
  await git('add', ['README.md'])
  const versions = JSON.parse(await fs.readFile(path.resolve(BASE_DIR, 'versions.json'), 'utf8'))
    .sort((a, b) => new Date(a.releaseTime) - new Date(b.releaseTime))
  await git('commit', ['-m', 'base'], { date: '2009-05-10T00:00:00Z' })
  const fromIndex = from === 'none' ? versions.length : (from ? versions.findIndex(v => v.id === from) : 0)
  const toIndex = to ? versions.findIndex(v => v.id === to) : versions.length - 1
  const processedVersions = versions.slice(Math.max(0, fromIndex), toIndex >= 0 ? toIndex + 1 : versions.length)
  console.log(`${versions.length} versions: refreshing ${fromIndex}-${toIndex} (${processedVersions.length})`)
  const queue = [...processedVersions]
  const workers = []
  for (let i = 0; i < NUM_WORKERS && i < queue.length; i++) workers.push(fork(path.resolve(__dirname, 'worker.js')))
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
    const versionDir = type + '/' + id
    const tempDir = path.resolve(DATA_DIR, id)
    if (fs.existsSync(tempDir)) {
      if (!fs.existsSync(type)) fs.mkdirSync(type)
      if (fs.existsSync(versionDir)) rmrf(versionDir)
      await run('mv', [tempDir, versionDir])
      await writeREADME(path.resolve(versionDir, 'README.md'), commit, version)
    }
    if (!fs.existsSync(versionDir)) {
      console.log(`${versionDir}/ doesn't exist: skipping`)
      continue
    }
    rmrf('latest')
    await run('cp', ['-r', versionDir, 'latest'])
    await git('add', [versionDir, 'latest'])
    if (fs.existsSync('latest/README.md')) {
      await run('cp', ['latest/README.md', '.'])
      await git('add', ['README.md'])
    }
    await git('commit', ['-m', id], { date: version.releaseTime })
    await git('tag', [id])
  }
  await git('remote', ['add', 'origin', 'git@github.com:skyrising/mc-data.git'])
  // await git('push', ['-f', '--tags', 'origin', 'master'])
}

function git (command, args = [], options = {}) {
  if (options.date) {
    if (!options.env) options.env = process.env
    const dateStr = options.date instanceof Date ? options.date.toISOString() : String(options.date)
    options.env.GIT_AUTHOR_DATE = dateStr
    options.env.GIT_COMMITTER_DATE = dateStr
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
