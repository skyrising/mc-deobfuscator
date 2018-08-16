import fs from 'fs'
import path from 'path'
import util from 'util'
const {getPromiseDetails} = process.binding('util')

let status = ''
let statusInterval
let statusInfo
let lastStatus
let statusCount = 0

export function startStatus (info) {
  statusInfo = info
  statusInterval = setInterval(printStatus, 100)
}

export function endStatus () {
  clearInterval(statusInterval)
  statusInterval = undefined
}

export function printStatus (s) {
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

export function setStatus (s) {
  status = s
}

function printLine (sgr, ...args) {
  process.stdout.write(`\x1b[${sgr}m${util.format(...args).replace('\n', '\x1b[K\n')}\x1b[0m\x1b[K\n`)
}

function log (...args) {
  console.debug(...args)
  printLine(0, ...args)
  printStatus()
}

console.log = log

console.warn = (...args) => {
  printLine(33, ...args)
  printStatus()
}

let errorLog

console.error = (...args) => {
  printLine(31, ...args)
  if (errorLog) errorLog.write(util.format(...args) + '\n')
  printStatus()
}

Object.assign(console.error, {
  set log (value) {
    if (value) {
      if (!errorLog) errorLog = fs.createWriteStream(path.resolve('error.log'))
    } else {
      errorLog = undefined
    }
  },
  get log () {
    return Boolean(errorLog)
  }
})
