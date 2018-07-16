import fs from 'mz/fs'
import path from 'path'
import cp from 'child_process'
import util from 'util'
import java from 'java'
import mvn from 'node-java-maven'
import {sync as rmrf} from 'rimraf'
import * as PKG from './PackageNames'
// import {graph} from './graphviz'
import {getDefaultName} from './util'
import * as renameGetterSetter from './analyzers/getterSetter'

const debug = require('debug')('mc:deobf')
const debugSearch = require('debug')('mc:deobf:search')
const debugMd = require('debug')('deobf:md')
const debugCl = require('debug')('deobf:cl')

const {getPromiseDetails} = process.binding('util')

const MAX_GENERIC_PASSES = 3
const MAX_SPECIAL_PASSES = 3
const MAX_TOTAL_PASSES = 8

const version = process.argv[2] || '1.12'
if (version.endsWith('.jar')) analyzeJar(path.resolve(version), []).catch(console.error)
else analyzeVersion(version).catch(console.error)

async function analyzeVersion (version) {
  console.log('Analyzing Minecraft version %s', version)
  const versionDir = path.resolve(process.env.HOME, '.minecraft/versions', version)
  console.log('Version directory: %s', versionDir)
  const metaFile = path.resolve(versionDir, version + '.json')
  debug('Reading meta file %s', metaFile)
  const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'))
  const classPath = [...new Set(meta.libraries.map(l => {
    const file = l.name.split(':')[0].replace(/\./g, '/').replace(/:/g, '/')
    const fn = l.name.split(':')
    return path.resolve(process.env.HOME, '.minecraft/libraries/' + file + '/' + fn[1] + '/' + fn[2] + '/' + fn[1] + '-' + fn[2] + '.jar')
  }))]
  console.log('Type: %s, Main class: %s', meta.type, meta.mainClass)
  const jarFile = path.resolve(versionDir, version + '.jar')
  return analyzeJar(jarFile, classPath)
}

async function analyzeJar (jarFile, classPath) {
  java.asyncOptions = {
    asyncSuffix: undefined,
    syncSuffix: '',
    promiseSuffix: 'Async',
    promisify: fn => function pfn () {
      const argsExtra = new Array(Math.max(0, fn.length - arguments.length - 1))
      const argsIn = [].slice.call(arguments)
      return new Promise((resolve, reject) => {
        const args = argsIn.concat(argsExtra)
        args.push((err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
        fn.apply(this, args)
      })
    }
  }
  await initMaven()
  const ClassPath = java.import('org.apache.bcel.util.ClassPath')
  const ClassPathRepository = java.import('org.apache.bcel.util.ClassPathRepository')
  const Repository = java.import('org.apache.bcel.Repository')
  const fullClassPath = [jarFile, ...classPath]
  console.log('Class path: ' + fullClassPath)
  Repository.setRepository(new ClassPathRepository(new ClassPath(fullClassPath.join(':'))))
  const slash = s => s.replace(/\./g, '/')
  const classNames = getAllClasses(jarFile).filter(name => !name.includes('/') || name.startsWith('net/minecraft'))
  console.log(classNames.length + ' classes, ' + classNames.filter(name => !name.includes('$')).length + ' outer classes')
  const info = {
    running: 0,
    pass: 0,
    maxParallel: 0,
    numAnalyzed: 0,
    classAnalyzeAvg: 0,
    _queue: [...classNames],
    genericAnalyzed: {},
    specialAnalyzed: {},
    totalAnalyzed: {},
    namedQueue: [],
    get hasWork () {
      return !!info._queue.length
    },
    get queue () {
      const name = info.namedQueue.shift()
      if (info.genericAnalyzed[name] === -1) {
        info.specialAnalyzed[name] = (info.specialAnalyzed[name] || 0) + 1
      } else {
        info.genericAnalyzed[name] = (info.genericAnalyzed[name] || 0) + 1
      }
      info.totalAnalyzed[name] = (info.totalAnalyzed[name] || 0) + 1
      return info._queue.shift()
    },
    set queue (items) {
      if (!items) return
      if (!Array.isArray(items)) items = [items]
      for (const item of items) {
        const name = typeof item === 'string' ? item : item.getClassName()
        if (info.namedQueue.includes(name)) continue
        if (info.genericAnalyzed[name] >= MAX_GENERIC_PASSES) continue
        if (info.specialAnalyzed[name] >= MAX_SPECIAL_PASSES) continue
        if (info.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
        if (info.totalAnalyzed[name] >= info.pass) info.pass = info.totalAnalyzed[name] + 1
        ;(info.class[name].analyzing || Promise.resolve()).then(() => {
          if (info.namedQueue.includes(name)) return
          debug('Queueing %s (%s, back)', (info.class[name].name || name), Math.max(info.genericAnalyzed[name], info.specialAnalyzed[name]) || 'new')
          info._queue.push(item)
          info.namedQueue.push(name)
        })
      }
    },
    queueFront (items) {
      if (!items) return
      if (!Array.isArray(items)) items = [items]
      for (const item of items) {
        const name = typeof item === 'string' ? item : item.getClassName()
        if (info.totalAnalyzed[name] >= MAX_TOTAL_PASSES) continue
        ;(info.class[name].analyzing || Promise.resolve()).then(() => {
          info.class[name].done = false
          debug('Queueing %s (%s, front)', (info.class[name].name || name), Math.max(info.genericAnalyzed[name], info.specialAnalyzed[name]) || 'new')
          info._queue.unshift(item)
          info.namedQueue.unshift(name)
        })
      }
    },
    classReverse: {},
    class: new Proxy({}, {
      get (classes, clsObfName) {
        clsObfName = clsObfName.replace(/\//g, '.')
        if (!classes[clsObfName]) {
          const clsInfo = classes[clsObfName] = {
            obfName: clsObfName,
            consts: new Set(),
            subClasses: new Set(),
            outerClassName: clsObfName.indexOf('$') > 0 ? clsObfName.slice(0, clsObfName.lastIndexOf('$')) : undefined,
            get outerClass () {
              if (!this.outerClassName) throw Error(`${this.name || this.obfName} is not an inner class`)
              return info.class[this.outerClassName]
            },
            isInnerClass: clsObfName.indexOf('$') > 0,
            set name (deobfName) {
              if (clsObfName.startsWith('java.')) {
                console.warn(Error('Tried renaming ' + clsObfName))
                return
              }
              deobfName = deobfName.replace(/\//g, '.')
              if (info.classReverse[deobfName] && info.classReverse[deobfName] !== slash(clsObfName)) {
                throw Error(`Duplicate name ${deobfName}: ${info.classReverse[deobfName]}, ${slash(clsObfName)}`)
              }
              const origDeobfName = deobfName
              if (this.isInnerClass) deobfName = deobfName.slice(deobfName.lastIndexOf(deobfName.includes('$') ? '$' : '.') + 1)
              if (this._name !== deobfName) {
                info.genericAnalyzed[deobfName] = -1
                info.specialAnalyzed[deobfName] = 0
                debugCl('CL: %s %s', slash(clsObfName), slash(deobfName))
                printStatus(clsObfName + ' -> ' + deobfName)
                info.queue = clsObfName
                for (const sc of this.subClasses) info.queue = sc
              }
              this._name = deobfName
              info.classReverse[origDeobfName] = slash(clsObfName)
            },
            get name () {
              return this._name
            },
            get numLines () {
              return Object.values(this.method).reduce((sum, m) => sum + (m.code ? m.code.lines.length : 0), 0)
            },
            field: {},
            reverseMethod: {},
            method: new Proxy({}, {
              get (mds, fullSig) {
                if (!mds[fullSig]) {
                  const [origName, sig] = fullSig.split(':')
                  mds[fullSig] = {
                    origName,
                    sig,
                    static: false,
                    set name (deobfName) {
                      const argSig = fullSig.slice(fullSig.indexOf('('), fullSig.indexOf(')') + 1) + (this.static ? ':static' : '')
                      const objectMethods = ['toString', 'clone', 'equals', 'hashCode', '<clinit>', '<init>']
                      if (objectMethods.includes(this.origName) && deobfName !== this.origName) {
                        console.warn(Error('Tried renaming ' + this.origName + ' to ' + deobfName))
                        return
                      }
                      if (this._name !== deobfName) {
                        if (clsInfo.reverseMethod[deobfName] &&
                            argSig in clsInfo.reverseMethod[deobfName] &&
                            clsInfo.reverseMethod[deobfName][argSig] !== origName) {
                          console.warn('%s.%s%s already exists (%s vs. %s)',
                            (clsInfo.name || clsObfName), deobfName, argSig,
                            clsInfo.reverseMethod[deobfName][argSig], origName)
                          return
                        }
                        if (this._name) {
                          console.info('%s.%s%s renamed to %s', (clsInfo.name || clsObfName), this._name, argSig, deobfName)
                        }
                        debugMd('MD: %s/%s %s %s/%s %s', slash(clsObfName), origName, sig, slash(classes[clsObfName].name || clsObfName), deobfName, sig)
                      }
                      this._name = deobfName
                      clsInfo.reverseMethod[deobfName] = clsInfo.reverseMethod[deobfName] || []
                      clsInfo.reverseMethod[deobfName][argSig] = origName
                    },
                    get name () {
                      return this._name
                    }
                  }
                }
                return mds[fullSig]
              }
            })
          }
        }
        return classes[clsObfName]
      },
      set (classes, clsObfName, value) {
        throw Error(`Setting info.class.${clsObfName} to ${value} is not allowed`)
      }
    }),
    method: new Proxy({}, {
      get (obj, fullSig) {
        const className = fullSig.slice(0, fullSig.lastIndexOf('.', fullSig.indexOf(':')))
        const methodSig = fullSig.slice(className.length + 1)
        return info.class[className].method[methodSig]
      }
    })
  }
  /*
  const mainClass = meta.mainClass === 'net.minecraft.launchwrapper.Launch' ? 'net.minecraft.client.Minecraft' : meta.mainClass
  if (mainClass !== meta.mainClass) console.log('Using alternative main class: %s', mainClass)
  info.queue = mainClass
  if (Repository.lookupClass('net.minecraft.data.Main')) {
    info.queue = 'net.minecraft.data.Main'
  }
  */
  startStatus(info)
  const ps = {}
  while (true) {
    while (info.hasWork) {
      const name = info.queue
      ps[name] = analyzeClassWrapper(name, info, Repository)
    }
    setStatus('Starting pass')
    info.analyzing = ps
    await Promise.all(Object.values(ps))
    if (!info.hasWork) break
  }
  console.log('Renaming getters & setters')
  await Promise.all(classNames.map(async name => {
    try {
      const cls = await Repository.lookupClass(name)
      const clsInfo = info.class[name]
      await runAnalyzer(renameGetterSetter, cls, clsInfo, info)
    } catch (e) {
      console.warn(e)
    }
  }))
  endStatus()
  console.log('Queue empty')
  const deobfJar = path.resolve(__dirname, './work/' + path.basename(jarFile, '.jar') + '-deobf.jar')
  const srcDir = path.resolve('./work/src/')
  // await renderGraph(info)
  const unknownClasses = Object.values(info.class).filter(c => !c.name)
  console.log(Object.values(info.classReverse).filter(name => !info.class[name].name.endsWith(getDefaultName(info.class[name]))).length + ' class names found')
  console.log(Object.values(info.classReverse).length + ' classes packaged')
  await specialSource(jarFile, deobfJar, info)
  console.log('Max parallel: %d, avg time %dms/class (sum: %dms)', info.maxParallel, Math.round(info.classAnalyzeAvg), Math.round(info.classAnalyzeAvg * info.numAnalyzed))
  console.log(unknownClasses.length + ' unknown classes: (Top 100)')
  console.log(unknownClasses
    .filter(c => !c.enumNames)
    .sort((a, b) => b.consts.size - a.consts.size)
    .slice(0, 100)
    .map(c => {
      const strings = [...c.consts]
      let s = c.obfName + ' lines: ' + c.numLines + ' strings: ' + strings.length
      let tc = c
      let i = 0
      while (tc.superClassName && i++ < 4) {
        const sc = info.class[tc.superClassName].name || tc.superClassName
        if (sc !== 'java.lang.Object') {
          s += ' extends ' + sc
          tc = info.class[tc.superClassName]
        } else break
      }
      s += ' ' + strings.slice(0, 10).map(s => JSON.stringify(s)).join(',').slice(0, 80)
      return s
    }).join('\n')
  )
  console.log('Enums:')
  console.log(unknownClasses
    .filter(c => c.enumNames)
    .sort((a, b) => {
      const s0 = b.enumNames.length - a.enumNames.length
      if (s0 !== 0) return s0
      if (!a.isInnerClass && b.isInnerClass) return -1
      if (a.isInnerClass && !b.isInnerClass) return 1
      const ta = a.enumNames.toString()
      const tb = b.enumNames.toString()
      if (ta > tb) return 1
      if (ta < tb) return -1
      return 0
    })
    .slice(0, 100)
    .map(c => c.obfName + ': ' + c.enumNames)
    .join('\n'))
  const binDir = path.resolve('./work/bin/')
  await extractJar(deobfJar, binDir)
  // await procyon(deobfJar, srcDir)
  // await fernflower(deobfJar, srcDir)
}

function getAllClasses (jarFileName) {
  const FileInputStream = java.import('java.io.FileInputStream')
  const JarInputStream = java.import('java.util.jar.JarInputStream')
  const stream = new JarInputStream(new FileInputStream(jarFileName))
  const names = []
  while (true) {
    const entry = stream.getNextJarEntry()
    if (!entry) break
    const name = entry.getName()
    if (!name.endsWith('.class')) continue
    names.push(name.slice(0, name.lastIndexOf('.')))
  }
  return names
}

/*
function renderGraph (info) {
  if (fs.existsSync('temp/graph.dot')) fs.unlinkSync('temp/graph.dot')
  const g = graph({
    fontname: 'sans-serif',
    overlap: false
  })
  const sgs = {}
  const getSubgraph = name => {
    if (!name) return g
    if (name in sgs) return sgs[name]
    const p = name.indexOf('.') === -1 ? g : getSubgraph(name.slice(0, name.lastIndexOf('.')))
    const sg = p.subgraph({name: JSON.stringify(name)})
    sgs[name] = sg
    return sg
  }
  for (const c of Object.values(info.class)) {
    let s = c.name && c.name.indexOf('.') > 0 ? getSubgraph(c.name.slice(0, c.name.lastIndexOf('.'))) : g
    s.node({name: JSON.stringify(c.obfName), label: c.name || c.obfName})
    if (c.superClassName) {
      g.edge(JSON.stringify(c.obfName), JSON.stringify(c.superClassName), {})
    }
  }
  fs.writeFileSync('temp/graph.dot', g.toString())
}
*/

function generateSrg (info, srgFile) {
  const slash = s => s.replace(/\./g, '/')
  const srg = []
  const getClassName = from => {
    const to = info.class[from]
    if (from.indexOf('$') < 0) {
      if (to.name) return to.name
      if (from.length >= 6) return from
      return slash(PKG.DEFAULT) + '/' + getDefaultName(to)
    }
    const toEnd = (to.name || from).slice((to.name || from).lastIndexOf('$') + 1)
    return getClassName(from.slice(0, from.lastIndexOf('$'))) + '$' + toEnd
  }
  for (const from in info.class) {
    const to = info.class[from]
    const toName = getClassName(from)
    if (toName) srg.push(`CL: ${slash(from)} ${slash(toName)}`)
    for (const fd in to.field) srg.push(`FD: ${slash(from)}/${fd} ${slash(toName)}/${to.field[fd]}`)
    for (const mdFrom in to.method) {
      const md = to.method[mdFrom]
      if (md.name) srg.push(`MD: ${slash(from)}/${md.origName} ${md.sig} ${slash(toName)}/${md.name} ${md.sig}`)
    }
  }
  const pkgSrg = [
    'PK: . ' + slash(PKG.DEFAULT),
    'PK: net net',
    'PK: ' + slash(PKG.BASE) + ' ' + slash(PKG.BASE),
    'PK: ' + slash(PKG.CLIENT) + ' ' + slash(PKG.CLIENT),
    'PK: net/minecraft/client/main net/minecraft/client/main',
    'PK: net/minecraft/realms net/minecraft/realms',
    'PK: net/minecraft/server net/minecraft/server'
  ]
  fs.writeFileSync(srgFile, pkgSrg.concat(srg.sort()).join('\n'))
}

function specialSource (inFile, outFile, info) {
  generateSrg(info, 'temp/mapping.srg')
  console.log('Deobfuscating with SpecialSource')
  cp.spawnSync('java', ['-jar', 'specialsource.jar', '-i', inFile, '-o', outFile, '-m', 'temp/mapping.srg', '--kill-lvt'], {
    stdio: ['ignore', 'inherit', fs.openSync('./temp/specialsource.warn', 'w')]
  })
}

function retroguard (inFile, outFile, info, classPath) {
  if (fs.existsSync('temp/clientrg.log')) fs.unlinkSync('temp/clientrg.log')
  if (fs.existsSync('temp/deobfrg.log')) fs.unlinkSync('temp/deobfrg.log')
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile)
  fs.writeFileSync('temp/retroguard.cfg', [
    'input = ' + inFile,
    'output = ' + outFile,
    'script = temp/client.cfg',
    'log = temp/clientrg.log',
    'deob = temp/mapping.srg',
    'nplog = temp/deobfrg.log',
    'verbose = 0',
    'quiet = 1',
    'fullmap = 0',
    'startindex = 0',
    '',
    'protectedpackage = paulscode',
    'protectedpackage = com/jcraft',
    'protectedpackage = isom',
    'protectedpackage = ibxm',
    'protectedpackage = de/matthiasmann/twl',
    'protectedpackage = org/xmlpull',
    'protectedpackage = javax/xml'
  ].join('\n'))
  generateSrg(info, 'temp/mapping.srg')
  console.log('Deobfuscating with RetroGuard')
  cp.spawnSync('java', ['-cp', 'retroguard.jar:' + classPath.join(':'), 'RetroGuard', '-searge', 'temp/retroguard.cfg'], {
    stdio: ['ignore', 'inherit', fs.openSync('./temp/rg.warn', 'w')]
  })
}

async function extractJar (jar, dir) {
  rmrf(dir)
  fs.mkdirSync(dir)
  console.log('Extracting ' + jar)
  cp.spawnSync('jar', ['xf', jar], {cwd: dir})
}

async function fernflower (jar, to) {
  const binDir = path.resolve('./work/bin/')
  await extractJar(jar, binDir)
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with fernflower')
  const mcp = true
  const args = ['-din=1', '-rbr=1', '-dgs=1', '-asc=1', '-rsy=1', '-iec=1', '-log=WARN', binDir, to]
  if (mcp) {
    cp.spawnSync('java', ['-jar', 'fernflower.jar'].concat(args), {stdio: 'inherit'})
  } else {
    cp.spawnSync('fernflower', args, {stdio: 'inherit'})
  }
}

async function procyon (jar, to) {
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with procyon')
  cp.spawnSync('procyon-decompiler', ['-v', 0, '-jar', jar, '-r', '-o', to], {stdio: 'inherit'})
}

async function findAnalyzer (name) {
  debugSearch('Searching for analyzer for %s', name)
  const parts = name.split('.')
  for (let i = 1; i <= parts.length; i++) {
    const fname = parts.slice(-i).join('.') + '.js'
    const file = path.resolve(__dirname, 'analyzers', parts.slice(0, -i).join('/'), fname)
    debugSearch('Checking %s', file)
    if (await fs.exists(file)) {
      try {
        return require(file)
      } catch (e) {
        console.log(e.message)
      }
    }
  }
}

const waiter = () => {
  const p = new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (p.waitingFor) p.waitingFor.then(resolve).catch(reject)
      p._waitingFor = p.waitingFor
      Object.assign(p, {
        set waitingFor (wf) {
          wf.then(resolve).catch(reject)
          this._waitingFor = wf
        },
        get waitingFor () {
          return this._waitingFor
        }
      })
    })
  })
  return p
}

async function analyzeClassWrapper (next, info, Repository) {
  let w = waiter()
  const start = Date.now()
  if (typeof next === 'string') {
    info.class[next].analyzing = w
    try {
      next = await Repository.lookupClass(next)
    } catch (e) {
      console.warn(e)
      return
    }
  } else {
    info.class[next.getClassName()].analyzing = w
  }
  info.maxParallel = Math.max(info.maxParallel, ++info.running)
  w.waitingFor = analyzeClass(next, info)
  return w.then(() => {
    info.running--
    const sum = info.classAnalyzeAvg * info.numAnalyzed + (Date.now() - start)
    info.classAnalyzeAvg = sum / ++info.numAnalyzed
  })
}

async function analyzeClass (cls, info) {
  const className = cls.getClassName()
  const clsInfo = info.class[className]
  if (clsInfo.done) return
  clsInfo.superClassName = cls.getSuperclassName()
  info.class[clsInfo.superClassName].subClasses.add(className)
  clsInfo.done = true
  clsInfo.bin = cls
  clsInfo.isInterface = cls.isInterface()
  const pkg = cls.getPackageName()
  if (pkg.startsWith('net.minecraft')) clsInfo.name = className
  const genericAnalyzer = require('./analyzers/generic')
  let analyzer = genericAnalyzer
  const special = clsInfo.name && (clsInfo.analyzer || await findAnalyzer(clsInfo.name || className))
  if (special) {
    console.log('Special analyzer for %s: %s', clsInfo.name, Object.keys(analyzer))
    clsInfo.analyzer = analyzer = special
    info.genericAnalyzed[className] = -1
  } else if (clsInfo.name) {
    debug('Generic analyzer for %s', clsInfo.name)
  }
  try {
    await runAnalyzer(analyzer, cls, clsInfo, info, genericAnalyzer)
  } catch (e) {
    console.error('Error while analyzing %s:\n%s', (clsInfo.name || className), e.stack)
  }
  setStatus(`Done with ${clsInfo.name || className}`)
}

let status = ''
let statusInterval
let statusInfo
let lastStatus
let statusCount = 0

function startStatus (info) {
  statusInfo = info
  statusInterval = setInterval(printStatus, 100)
}

function endStatus () {
  clearInterval(statusInterval)
  statusInterval = undefined
}

function printStatus (s) {
  if (s) status = s
  if (!statusInfo || !statusInterval) return
  if (status === lastStatus) {
    statusCount++
  } else {
    lastStatus = status
    statusCount = 0
  }
  const done = statusInfo.numAnalyzed
  const total = done + statusInfo._queue.length
  const perc = (done * 100 / total).toFixed(2) + '%'
  process.stdout.write(`[Pass ${statusInfo.pass} ${perc} ${done}/${total}] ${status}\x1b[K\r`)
  if (statusCount === 50) {
    const mapped = {}
    for (const key in statusInfo.analyzing) {
      const details = getPromiseDetails(statusInfo.analyzing[key])
      if (details[0] === 1) continue
      mapped[key] = details
    }
    console.warn(mapped)
  }
}

function setStatus (s) {
  status = s
}

function printLine (sgr, ...args) {
  process.stdout.write(`\x1b[${sgr}m${util.format(...args).replace('\n', '\x1b[K\n')}\x1b[0m\x1b[K\n`)
}
function log (...args) {
  printLine(0, ...args)
  printStatus()
}
console.log = log
console.warn = (...args) => {
  printLine(33, ...args)
  printStatus()
}
console.error = (...args) => {
  printLine(31, ...args)
  printStatus()
}

async function runAnalyzer (analyzer, cls, clsInfo, info, genericAnalyzer) {
  const className = cls.getClassName()
  if (analyzer.cls) {
    if (analyzer !== genericAnalyzer) debug('%s: Running analyzer.cls', (clsInfo.name || className))
    setStatus(`${clsInfo.name || className}`)
    const name = await analyzer.cls(cls, clsInfo, info)
    if (name) {
      clsInfo.name = name
      info.genericAnalyzed[className] = -1
    }
  }
  if (analyzer.field) {
    for (const field of await cls.getFieldsAsync()) {
      const obfName = await field.getNameAsync()
      if (clsInfo.field[obfName]) continue
      if (analyzer !== genericAnalyzer) debug('%s.%s: Running analyzer.field', (clsInfo.name || className), obfName)
      setStatus(`${clsInfo.name || className}.${obfName}`)
      const deobfName = await analyzer.field(field, clsInfo, info, cls)
      if (deobfName) {
        clsInfo.field[obfName] = deobfName
        clsInfo.done = false
      } else if (genericAnalyzer && analyzer !== genericAnalyzer) {
        const deobfName = await genericAnalyzer.field(field, clsInfo, info, cls)
        if (deobfName) clsInfo.field[obfName] = deobfName
      }
    }
  }
  /*
  const scl = cls.getSuperclassName()
  if (scl.length <= 5) info.queue = scl
  for (const inf of cls.getInterfaces()) {
    info.queue = inf.getClassName()
  }
  */
  for (const method of await cls.getMethodsAsync()) {
    const name = await method.getNameAsync()
    const sig = await method.getSignatureAsync()
    const methodInfo = clsInfo.method[name + ':' + sig]
    methodInfo.obfName = name
    methodInfo.sig = sig
    methodInfo.static = await method.isStaticAsync()
    if (methodInfo.done) continue
    if (analyzer !== genericAnalyzer) debug('Analyzing method %s.%s:%s', (clsInfo.name || className), name, sig)
    setStatus(`${clsInfo.name || className}.${name}${sig}`)
    const code = methodInfo.code = methodInfo.code || await getCode(method)
    for (const c of code.consts) if (typeof c === 'string') clsInfo.consts.add(c)
    // for (const call of code.internalCalls) if (call.fullClassName !== className) info.queue = call.fullClassName
    // for (const field of code.internalFields) if (field.fullClassName !== className) info.queue = field.fullClassName
    if (analyzer.method) {
      methodInfo.done = true
      const name = await analyzer.method(cls, method, code, methodInfo, clsInfo, info)
      if (name) methodInfo.name = name
      else if (genericAnalyzer && analyzer !== genericAnalyzer) {
        const name = await genericAnalyzer.method(cls, method, code, methodInfo, clsInfo, info)
        if (name) methodInfo.name = name
      }
    } else if (genericAnalyzer && analyzer !== genericAnalyzer) {
      const name = await genericAnalyzer.method(cls, method, code, methodInfo, clsInfo, info)
      if (name) methodInfo.name = name
    }
  }
}

async function getCode (method) {
  let code
  try {
    code = await method.getCodeAsync().then(c => c.toStringAsync())
  } catch (e) {
    return {code: '', lines: [], calls: [], internalCalls: [], fields: [], internalFields: [], consts: []}
  }
  const calls = []
  const fields = []
  const consts = []
  const internalCalls = []
  const internalFields = []
  const lines = code.split('\n').filter(l => /^\d+:/.test(l)).map(l => {
    const match = l.match(/^(\d+):\s+([^\t]+)\s*(.*?)(?: \(\d+\))?$/)
    if (!match) return
    const [, offset, op, arg] = match
    const line = {offset: +offset, op, arg, [util.inspect.custom]: () => op + ' ' + arg}
    if (op === 'invokestatic' || op === 'invokevirtual' || op === 'invokespecial' || op === 'invokeinterface') {
      const fullSig = arg
      const [, pkg, className, methodName, signature] = fullSig.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const call = {fullSig, pkg, className, methodName, signature, [util.inspect.custom]: () => op + ' ' + fullSig}
      call.fullClassName = pkg ? pkg + '.' + className : className
      line.call = call
      calls.push(call)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalCalls.push(call)
    } else if (op === 'getfield' || op === 'getstatic') {
      const [, pkg, className, fieldName, type] = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const field = {fullSig: arg, pkg, className, fieldName, type, [util.inspect.custom]: () => op + ' ' + arg}
      field.fullClassName = pkg ? pkg + '.' + className : className
      line.field = field
      fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalFields.push(field)
    } else if (op === 'putfield' || op === 'putstatic') {
      const [, pkg, className, fieldName, type] = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const field = {fullSig: arg, pkg, className, fieldName, type, [util.inspect.custom]: () => op + ' ' + arg}
      field.fullClassName = pkg ? pkg + '.' + className : className
      line.field = field
      fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalFields.push(field)
    } else if (op === 'ldc_w' || op === 'ldc' || op === 'bipush' || op === 'sipush' || op === 'ipush') {
      try {
        line.const = JSON.parse(arg)
      } catch (e) {
        line.const = arg
      }
      consts.push(line.const)
    } else if (op.startsWith('iconst_')) {
      line.const = +op[7]
      consts.push(line.const)
    } else if (op === 'new') {
      line.className = arg.slice(1, -1)
    } else if (/^[ilfda]load_\d$/.test(op)) {
      line.load = +op[6]
      line.loadType = op[0]
    } else if (/^[ilfda]load$/.test(op)) {
      line.load = +arg.slice(1)
      line.loadType = op[0]
    }
    Object.assign(line, {
      nextOp (line, includeSelf = false) {
        const [op, arg] = line.split(' ')
        if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        if (!this.next) return
        if (this.next.op === op && (!arg || this.next.arg === arg)) return this.next
        return this.next.nextOp(line)
      },
      prevOp (line, includeSelf = false) {
        const [op, arg] = line.split(' ')
        if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        if (!this.previous) return
        if (this.previous.op === op && (!arg || this.previous.arg === arg)) return this.previous
        return this.previous.prevOp(line)
      }
    })
    return line
  }).filter(l => !!l)
  for (let i = 0; i < lines.length - 1; i++) lines[i].next = lines[i + 1]
  for (let i = 1; i < lines.length; i++) lines[i].previous = lines[i - 1]
  return {code, lines, calls, internalCalls, fields, internalFields, consts}
}

async function initMaven () {
  return new Promise((resolve, reject) => {
    const cLog = console.log
    console.log = require('debug')('maven')
    mvn((err, results) => {
      console.log = cLog
      if (err) return reject(err)
      results.classpath.forEach(c => java.classpath.push(c))
      resolve()
    })
  })
}
