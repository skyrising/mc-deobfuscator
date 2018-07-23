import util from 'util'

export async function getCode (method) {
  let code
  try {
    code = await method.getCodeAsync().then(c => c.toStringAsync())
  } catch (e) {
    return {code: '', lines: [], calls: [], internalCalls: [], fields: [], internalFields: [], consts: []}
  }
  const calls = []
  const fields = []
  const consts = []
  const internalCalls = []
  const internalFields = []
  const lines = code.split('\n').filter(l => /^\d+:/.test(l)).map(l => {
    const match = l.match(/^(\d+):\s*([^\t]+)\s*(.*?)(?: \(\d+\))?$/)
    if (!match) return
    const [, offset, op, arg] = match
    const line = {offset: +offset, op, arg, [util.inspect.custom]: () => op + ' ' + arg}
    if (op === 'invokestatic' || op === 'invokevirtual' || op === 'invokespecial' || op === 'invokeinterface') {
      const fullSig = arg
      const [, pkg, className, methodName, signature] = fullSig.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const call = {fullSig, pkg, className, methodName, signature, [util.inspect.custom]: () => op + ' ' + fullSig}
      call.fullClassName = pkg ? pkg + '.' + className : className
      line.call = call
      calls.push(call)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalCalls.push(call)
    } else if (op === 'getfield' || op === 'getstatic') {
      const [, pkg, className, fieldName, type] = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const field = {fullSig: arg, pkg, className, fieldName, type, [util.inspect.custom]: () => op + ' ' + arg}
      field.fullClassName = pkg ? pkg + '.' + className : className
      line.field = field
      fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalFields.push(field)
    } else if (op === 'putfield' || op === 'putstatic') {
      const [, pkg, className, fieldName, type] = arg.match(/(?:((?:.*\.)*(?:.*))\.)?(.*)\.(.*):(.*)$/)
      const field = {fullSig: arg, pkg, className, fieldName, type, [util.inspect.custom]: () => op + ' ' + arg}
      field.fullClassName = pkg ? pkg + '.' + className : className
      line.field = field
      fields.push(field)
      if ((!pkg || pkg.startsWith('net.minecraft')) && className[0] !== '[') internalFields.push(field)
    } else if (op === 'ldc_w' || op === 'ldc' || op === 'bipush' || op === 'sipush' || op === 'ipush') {
      try {
        line.const = JSON.parse(arg)
      } catch (e) {
        line.const = arg
      }
      consts.push(line.const)
    } else if (op.startsWith('iconst_')) {
      line.const = +op[7]
      consts.push(line.const)
    } else if (op === 'new') {
      line.className = arg.slice(1, -1)
    } else if (/^[ilfda]load_\d$/.test(op)) {
      line.load = +op[6]
      line.loadType = op[0]
    } else if (/^[ilfda]load$/.test(op)) {
      line.load = +arg.slice(1)
      line.loadType = op[0]
    } else if (/^[ilfda]return$/.test(op)) {
      line.return = true
      line.returnType = op[0]
    }
    Object.assign(line, {
      nextOp (line, includeSelf = false) {
        line = Array.isArray(line) ? line : [line]
        for (const candidate of line) {
          const [op, arg] = candidate.split(' ')
          if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        }
        if (!this.next) return
        return this.next.nextOp(line, true)
      },
      prevOp (line, includeSelf = false) {
        line = Array.isArray(line) ? line : [line]
        for (const candidate of line) {
          const [op, arg] = candidate.split(' ')
          if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        }
        if (!this.previous) return
        return this.previous.prevOp(line, true)
      }
    })
    return line
  }).filter(l => !!l)
  for (let i = 0; i < lines.length - 1; i++) lines[i].next = lines[i + 1]
  for (let i = 1; i < lines.length; i++) lines[i].previous = lines[i - 1]
  return {code, lines, calls, internalCalls, fields, internalFields, consts}
}

function resolve (info, raw) {
  if (raw.length === 1 || raw[0] === 'L') return raw
  const cls = info.classReverse[raw]
  if (cls) return 'L' + cls + ';'
}

class Signature {
  constructor (args, ret) {
    this.args = args
    this.return = ret
  }

  matches (methodInfo) {
    const filled = this.fill(methodInfo.info)
    // TODO: wildcards
    if (!filled) methodInfo.clsInfo.done = false
    else return methodInfo.sig === filled
  }

  fill (info) {
    const args = []
    for (let i = 0; i < this.args.length; i++) {
      args[i] = resolve(info, this.args[i])
      if (!args[i]) return
    }
    const ret = resolve(info, this.return)
    if (!ret) return
    return '(' + args.join('') + ')' + ret
  }
}

// TODO: arrays
export function signatureTag (strings, ...args) {
  const parsedArgs = []
  let parsedReturn
  let startArgs
  let endArgs
  for (const str of strings) {
    for (let i = 0; i < str.length; i++) {
      const c = str[i]
      if (c === '(') {
        if (startArgs) throw Error('Unexpected (')
        startArgs = true
        continue
      }
      if (c === ')') {
        if (endArgs) throw Error('Unexpected )')
        endArgs = true
        continue
      }
      if (startArgs) {
        if (c === 'L') {
          const colon = str.indexOf(';', i) + 1
          const cls = str.slice(i, colon)
          i = colon - 1
          if (!endArgs) parsedArgs.push(cls)
          else parsedReturn = cls
        } else {
          if (!endArgs) parsedArgs.push(c)
          else parsedReturn = c
        }
      }
    }
    if (args.length) {
      const next = args.shift()
      if (!next) throw Error(`Invalid parameter for ${endArgs ? 'return type' : 'argument ' + parsedArgs.length}`)
      if (!endArgs) parsedArgs.push(next)
      else parsedReturn = next
    }
  }
  return new Signature(parsedArgs, parsedReturn)
}
