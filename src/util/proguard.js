import request from 'request'
import {Readable} from 'stream'

export async function readMappings(stream) {
  const mappings = {}
  let currentClass
  await processLines(stream, async line => {
    line = line.trim()
    if (line.startsWith('#')) return
    if (line.endsWith(':')) {
      const [, from, mapped] = line.match(/^(.*?)\s*->\s*(.*?):$/)
      currentClass = {
        mapped,
        fields: {},
        methods: {}
      }
      mappings[from] = currentClass
    } else {
      const [from, mapped] = line.split(' -> ')
      if (from.endsWith(')')) {
        const match = from.match(/^(?:(\d+):(\d+):)?(.*?) (.*?)\((.*?)\)$/)
        if (!match) {
          console.log(line)
          return
        }
        const [, lineFrom, lineTo, returnType, name, args] = match
        currentClass.methods[`${name}(${args}):${returnType}`] = {
          name,
          lineFrom: lineFrom !== undefined ? +lineFrom : undefined,
          lineTo: lineTo !== undefined ? +lineTo : undefined,
          returnType, mapped, args: args ? args.split(',') : []
        }
      } else {
        const [type, name] = from.split(' ')
        currentClass.fields[`${name}:${type}`] = {
          name, type, mapped
        }
      }
    }
  })
  return mappings
}

async function processLines(stream, processLine) {
  if (!stream.setEncoding) {
    stream = new Readable().wrap(stream)
  }
  let line = ''
  stream.setEncoding('utf-8')
  for await (const data of stream) {
    const lines = data.split('\n')
    lines[0] = line + lines[0]
    line = lines.pop()
    await Promise.all(lines.map(processLine))
  }
  if (line) await processLine(line)
}

export function mergeMappings(...mappings) {
  const merged = {}
  for (const mapping of mappings) {
    for (const className of Object.keys(mapping)) {
      const currentClassMapping = mapping[className]
      if (className in merged) {
        const classMapping = merged[className]
        if (currentClassMapping.mapped !== classMapping.mapped) {
          throw Error(`Conflicting mapping for ${className}: ${currentClassMapping.mapped} vs. ${classMapping.mapped}`)
        }
        Object.assign(classMapping.fields, currentClassMapping.fields)
        Object.assign(classMapping.methods, currentClassMapping.methods)
      } else {
        merged[className] = {
          ...currentClassMapping,
          fields: {...currentClassMapping.fields},
          methods: {...currentClassMapping.methods}
        }
      }
    }
  }
  return merged
}

function writeLine(writable, line) {
  return new Promise((resolve, reject) => {
    if (!writable.write(line + '\n', 'utf-8')) {
      writable.once('drain', resolve)
    } else resolve()
  })
}

function sortMethodsOrFields(a, b) {
  if (a.lineFrom === undefined || b.lineFrom === undefined || a.lineFrom === b.lineFrom) {
    return a.mapped < b.mapped ? -1 : 1
  }
  return a.lineFrom - b.lineFrom
}

export async function writeMappings(mapping, writable) {
  for (const className of Object.keys(mapping).sort()) {
    const classMapping = mapping[className]
    await writeLine(writable, `${className} -> ${classMapping.mapped}:`)
    for (const field of Object.values(classMapping.fields).sort(sortMethodsOrFields)) {
      await writeLine(writable, `    ${field.type} ${field.name} -> ${field.mapped}`)
    }
    for (const method of Object.values(classMapping.methods).sort(sortMethodsOrFields)) {
      if (method.lineFrom !== undefined) {
        await writeLine(writable, `    ${method.lineFrom}:${method.lineTo}:${method.returnType} ${method.name}(${method.args.join(',')}) -> ${method.mapped}`)
      } else {
        await writeLine(writable, `    ${method.returnType} ${method.name}(${method.args.join(',')}) -> ${method.mapped}`)
      }
    }
  }
}
