// @flow
import fs from 'fs'
import path from 'path'
import util from 'util'
// $FlowFixMe: not in libdefs yet
import { PerformanceObserver } from 'perf_hooks'

let status = ''
let statusInterval
let statusInfo
const passMeasures = []
const perfObs = new PerformanceObserver(list => {
  for (const e of list.getEntries()) {
    console.debug(e)
    if (e.name.startsWith('pass::') && e.entryType === 'measure') passMeasures.push(e)
  }
})

export function startStatus (info: FullInfo) {
  statusInfo = info
  statusInterval = setInterval(printStatus, 100)
  statusInterval.unref()
  perfObs.observe({ entryTypes: ['mark', 'measure', 'gc'] })
}

export function endStatus () {
  clearInterval(statusInterval)
  statusInterval = undefined
  perfObs.disconnect()
  console.log(passMeasures)
}

export function printStatus (s?: string) {
  if (s) status = s
  if (!statusInfo || !statusInterval) return
  if (statusInfo.currentPass) {
    const pass = statusInfo.currentPass
    const numClasses = statusInfo.classNames ? statusInfo.classNames.length : statusInfo.estNumClasses
    const numPasses = statusInfo.passes.length
    const weightedDone = statusInfo.passes.reduce((sum, pass) => sum + (pass.ended ? pass.weight : 0), 0) + pass.analyzed * pass.weight / numClasses
    const weightedTotal = statusInfo.passes.reduce((sum, pass) => sum + pass.weight, 0)
    const perc = (weightedDone * 100 / weightedTotal).toFixed(2) + '%'
    process.stdout.write(`[Pass ${pass.name} ${statusInfo.pass}/${numPasses} ${perc} ${pass.analyzed} of ${numClasses}] ${status}\x1b[K\r`)
  }
}

export function setStatus (s: string) {
  status = s
}

function printLine (sgr: number, fmt: string, ...args: Array<mixed>) {
  process.stdout.write(`\x1b[${sgr}m${util.format(fmt, ...args).replace('\n', '\x1b[K\n')}\x1b[0m\x1b[K\n`)
}

function log (fmt: string, ...args: Array<mixed>) {
  console.debug(fmt, ...args)
  printLine(0, fmt, ...args)
  printStatus()
}

;(console: any).log = log

;(console: any).warn = (fmt: string, ...args: Array<mixed>) => {
  printLine(33, fmt, ...args)
  printStatus()
}

let errorLog
let prevError
let prevErrorCount = 1

;(console: any).error = (fmt: string, ...args: Array<mixed>) => {
  const formatted = util.format(fmt, ...args)
  if (formatted === prevError) {
    prevErrorCount++
  } else {
    if (prevErrorCount > 1) {
      printLine(32, 'Previous error repeated %d times', prevErrorCount)
      if (errorLog) errorLog.write('Previous error repeated ' + prevErrorCount + ' times\n')
    }
    prevError = formatted
    prevErrorCount = 1
    printLine(31, fmt, ...args)
    if (errorLog) errorLog.write(formatted + '\n')
    printStatus()
  }
}

process.on('exit', () => {
  if (prevErrorCount > 1) {
    printLine(32, 'Previous error repeated %d times', prevErrorCount)
    if (errorLog) errorLog.write('Previous error repeated ' + prevErrorCount + ' times\n')
  }
  prevErrorCount = 1
})

// $FlowFixMe: value expected but TypeError: Invalid property descriptor. Cannot both specify accessors and a value or writable attribute, #<Object>
Object.defineProperty(console.error, 'log', {
  set (value: boolean) {
    if (value) {
      if (!errorLog) errorLog = fs.createWriteStream(path.resolve('error.log'))
    } else {
      errorLog = undefined
    }
  },
  get () {
    return errorLog
  }
})
