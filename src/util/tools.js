import fs from 'mz/fs'
import path from 'path'
import cp from 'child_process'
import { sync as rmrf } from 'rimraf'

import { generateOutput } from './output'

const BASE_DIR = path.resolve(__dirname, '../../')
const TOOLS_DIR = path.resolve(BASE_DIR, 'work/lib')

export async function specialSource (inFile, outFile, info, format = 'tsrg') {
  const mapping = (await generateOutput(info))[format]
  console.log('Mapping: ' + mapping)
  console.log('Deobfuscating with SpecialSource')
  cp.spawnSync('java', ['-jar', path.resolve(TOOLS_DIR, 'specialsource.jar'), '-i', inFile, '-o', outFile, '-m', mapping, '--kill-lvt'], {
    stdio: ['ignore', 'inherit', fs.openSync(path.resolve(BASE_DIR, 'temp/specialsource.warn'), 'w')]
  })
}

/*
export function retroguard (inFile, outFile, info, classPath) {
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
  cp.spawnSync('java', ['-cp', 'work/lib/retroguard.jar:' + classPath.join(':'), 'RetroGuard', '-searge', 'temp/retroguard.cfg'], {
    stdio: ['ignore', 'inherit', fs.openSync('./temp/rg.warn', 'w')]
  })
}
*/

function spawn (program, args, opts) {
  return new Promise((resolve, reject) => {
    const c = cp.spawn(program, args, opts)
    c.on('exit', code => {
      if (code) reject(code)
      else resolve(code)
    })
  })
}

export async function extractJar (jar, dir) {
  rmrf(dir)
  fs.mkdirSync(dir)
  console.log('Extracting ' + jar + ' to ' + dir)
  return spawn('jar', ['xf', jar], { cwd: dir })
}

export async function fernflower (binDir, to, cp, flavor = 'fernflower') {
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with ' + flavor)
  const args = ['-din=1', '-rbr=1', '-dgs=1', '-asc=1', '-rsy=1', '-iec=1', '-jvn=1', '-sef=1', '-log=WARN', binDir, to]
  const decompJar = path.resolve(TOOLS_DIR, flavor + '.jar')
  if (fs.existsSync(decompJar)) return spawn('java', ['-jar', decompJar].concat(args), { stdio: 'inherit' })
  return spawn(flavor, args, { stdio: 'inherit' })
}

export function forgeflower (jar, to, cp) {
  return fernflower(jar, to, cp, 'forgeflower')
}

export async function procyon (jar, to, cp) {
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with procyon')
  return spawn('procyon-decompiler', ['-v', 0, '-jar', jar, '-r', '-o', to], { stdio: 'inherit' })
}

export async function cfr (jar, to, cp = [], ...extraArgs) {
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with CFR')
  const cfrJar = path.resolve(TOOLS_DIR, 'cfr.jar')
  const args = [jar, '--showversion', 'false', '--silent', 'false', '--outputdir', to]
  if (cp.length) {
    args.push('--extraclasspath', cp.join(':'))
  }
  if (fs.existsSync(cfrJar)) return spawn('java', ['-Xmx4G', '-jar', cfrJar].concat(args).concat(extraArgs), { stdio: 'inherit' })
  return spawn('cfr', args, { stdio: 'inherit' })
}

export async function stitch (...args) {
  return spawn('java', ['-jar', path.resolve(TOOLS_DIR, 'stitch.jar'), ...args], { stdio: 'inherit' })
}

export async function enigma (...args) {
  return spawn('java', ['-cp', path.resolve(TOOLS_DIR, 'enigma.jar'), 'cuchaz.enigma.CommandMain', ...args], { stdio: 'inherit' })
}

export async function tinyRemapper (input, output, mappings, from = 'official', to = 'named') {
  console.log(`Remapping ${input} -> ${output} with ${mappings} (${from} -> ${to})`)
  return spawn('java', ['-jar', path.resolve(TOOLS_DIR, 'tiny-remapper.jar'), input, output, mappings, from, to], { stdio: 'inherit' })
}
