import fs from 'fs'
import path from 'path'
import {diffArrays} from 'diff'

const dirOld = process.argv[2]
const dirNew = process.argv[3]

function readList (dir: string, file: string) {
  return fs.readFileSync(path.resolve(dir, file), 'utf8').split('\n').filter(Boolean)
}

const hashesOld = readList(dirOld, 'class-hashes.txt')
const hashesNew = readList(dirNew, 'class-hashes.txt')

const classesOld = readList(dirOld, 'classes-deobf.txt')
const classesNew = readList(dirNew, 'classes-deobf.txt')

console.log(hashesOld.length + ' -> ' + hashesNew.length)
let oldIndex = 0
let newIndex = 0
const oldSet = []
const newSet = []
while (oldIndex < hashesOld.length && newIndex < hashesNew.length) {
  const oldHash = hashesOld[oldIndex++]
  const newHash = hashesNew[newIndex++]
  oldSet.push(oldHash)
  newSet.push(newHash)
  // console.log(oldSet.join(',') + ' : ' + newSet.join(','))
  const oldSetStartOffset = oldIndex - oldSet.length
  const newSetStartOffset = newIndex - newSet.length
  if (oldSet.includes(newHash)) {
    const newInOldIndex = oldSet.indexOf(newHash)
    // console.log(oldSet.join(',') + ' : ' + newSet.join(',') + '  index: ' + newInOldIndex)
    const newLength = newSet.length
    for (let i = 0; i < newLength - 1; i++) {
      // console.log(i, i < newInOldIndex)
      if (i < newInOldIndex) {
        console.log(`${classesOld[oldSetStartOffset + i]} (${oldSet.shift()}) -> ${classesNew[newSetStartOffset + i]} (${newSet.shift()})`)
      } else {
        newSet.shift()
        console.log('+' + classesNew[newSetStartOffset + i])
      }
    }
    // console.log(oldSet.join(',') + ' : ' + newSet.join(','))
    oldSet.shift()
    newSet.shift()
  } else if (newSet.includes(oldHash)) {
    const oldInNewIndex = newSet.indexOf(oldHash)
    // console.log(oldSet.join(',') + ' : ' + newSet.join(',') + '  index: ' + oldInNewIndex)
    const oldLength = oldSet.length
    for (let i = 0; i < oldLength - 1; i++) {
      if (i < oldInNewIndex) {
        console.log(`${classesOld[oldSetStartOffset + i]} (${oldSet.shift()}) -> ${classesNew[newSetStartOffset + i]} (${newSet.shift()})`)
      } else {
        oldSet.shift()
        console.log('-' + classesOld[oldSetStartOffset + i])
      }
    }
    // console.log(oldSet.join(',') + ' : ' + newSet.join(','))
    oldSet.shift()
    newSet.shift()
  }
}
