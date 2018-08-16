import path from 'path'
import mvn from 'node-java-maven'
import java from 'java'

import {sortObfClassName} from './index'

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
  return names.sort(sortObfClassName)
}

export async function initMaven () {
  return new Promise((resolve, reject) => {
    const cLog = console.log
    console.log = require('debug')('maven')
    mvn({packageJsonPath: path.resolve(__dirname, '../../package.json')}, (err, results) => {
      console.log = cLog
      if (err) return reject(err)
      results.classpath.forEach(c => java.classpath.push(c))
      resolve()
    })
  })
}

let javaInitted
export async function initJava (classPath) {
  if (!javaInitted) {
    javaInitted = (async () => {
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
    })()
  }
  await javaInitted
  const ClassPath = java.import('org.apache.bcel.util.ClassPath')
  const ClassPathRepository = java.import('org.apache.bcel.util.ClassPathRepository')
  const Repository = java.import('org.apache.bcel.Repository')
  Repository.setRepository(new ClassPathRepository(new ClassPath(classPath.join(':'))))
  return Repository
}
