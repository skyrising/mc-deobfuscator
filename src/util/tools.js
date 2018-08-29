import fs from 'mz/fs'
import path from 'path'
import cp from 'child_process'
import {sync as rmrf} from 'rimraf'

import {generateOutput} from './output'

export function specialSource (inFile, outFile, info, format = 'srg') {
  const mapping = generateOutput(info)[format]
  console.log('Deobfuscating with SpecialSource')
  cp.spawnSync('java', ['-jar', 'work/specialsource.jar', '-i', inFile, '-o', outFile, '-m', mapping, '--kill-lvt'], {
    stdio: ['ignore', 'inherit', fs.openSync('./temp/specialsource.warn', 'w')]
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
  cp.spawnSync('java', ['-cp', 'work/retroguard.jar:' + classPath.join(':'), 'RetroGuard', '-searge', 'temp/retroguard.cfg'], {
    stdio: ['ignore', 'inherit', fs.openSync('./temp/rg.warn', 'w')]
  })
}
*/

export async function extractJar (jar, dir) {
  rmrf(dir)
  fs.mkdirSync(dir)
  console.log('Extracting ' + jar + ' to ' + dir)
  cp.spawnSync('jar', ['xf', jar], {cwd: dir})
}

export async function fernflower (jar, to) {
  const binDir = path.resolve('./work/bin/')
  await extractJar(jar, binDir)
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with fernflower')
  const mcp = true
  const args = ['-din=1', '-rbr=1', '-dgs=1', '-asc=1', '-rsy=1', '-iec=1', '-log=WARN', binDir, to]
  if (mcp) {
    cp.spawnSync('java', ['-jar', 'work/fernflower.jar'].concat(args), {stdio: 'inherit'})
  } else {
    cp.spawnSync('fernflower', args, {stdio: 'inherit'})
  }
}

export async function procyon (jar, to) {
  rmrf(to)
  fs.mkdirSync(to)
  console.log('Decompiling with procyon')
  cp.spawnSync('procyon-decompiler', ['-v', 0, '-jar', jar, '-r', '-o', to], {stdio: 'inherit'})
}
