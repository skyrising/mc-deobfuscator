import mvn from 'node-java-maven'
import java from 'java'

export function getAllClasses (jarFileName) {
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

export async function initMaven () {
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
