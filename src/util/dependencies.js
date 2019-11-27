import fs from 'fs'
import path from 'path'
import request0 from 'request'

const DEPENDENCIES = {
  'specialsource.jar': 'https://oss.sonatype.org/content/repositories/snapshots/net/md-5/SpecialSource/1.8.6-SNAPSHOT/SpecialSource-1.8.6-20181101.100749-1-shaded.jar',
  'forgeflower.jar': 'https://files.minecraftforge.net/maven/net/minecraftforge/forgeflower/1.5.380.24/forgeflower-1.5.380.24.jar',
  'cfr.jar': 'https://www.benf.org/other/cfr/cfr-0.148.jar',
  'jsr305.jar': 'https://search.maven.org/remotecontent?filepath=com/google/code/findbugs/jsr305/3.0.2/jsr305-3.0.2.jar',
  'enigma.jar': 'https://maven.fabricmc.net/cuchaz/enigma/0.14.2.144/enigma-0.14.2.144-all.jar',
  'tiny-remapper.jar': 'https://maven.fabricmc.net/net/fabricmc/tiny-remapper/0.2.0.57/tiny-remapper-0.2.0.57-fat.jar',
  'stitch.jar': 'https://maven.fabricmc.net/net/fabricmc/stitch/0.4.0.67/stitch-0.4.0.67-all.jar'
}

const WORK_DIR = 'work'
const LIB_DIR = path.resolve(WORK_DIR, 'lib')

if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR)
if (!fs.existsSync(LIB_DIR)) fs.mkdirSync(LIB_DIR)

;(async () => {
  const ps = []
  for (const file in DEPENDENCIES) {
    const f = path.resolve(LIB_DIR, file)
    if (fs.existsSync(f)) continue
    ps.push(download(DEPENDENCIES[file], f))
  }
  await Promise.all(ps)
})()

function download (url, file) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} -> ${file}`)
    const out = fs.createWriteStream(file)
    request0(url).on('error', reject).on('end', () => {
      console.log(`Finished downloading ${file}`)
      resolve(file)
    }).pipe(out)
  })
}
