import fs from 'mz/fs'
import path from 'path'

const debugSearch = require('debug')('mc:deobf:search')

export async function findAnalyzer (name) {
  debugSearch('Searching for analyzer for %s', name)
  const parts = name.split('.')
  for (let i = 1; i <= parts.length; i++) {
    const fname = parts.slice(-i).join('.') + '.js'
    const file = path.resolve(__dirname, '../analyzers', parts.slice(0, -i).join('/'), fname)
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
