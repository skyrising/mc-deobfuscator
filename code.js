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
    }
    Object.assign(line, {
      nextOp (line, includeSelf = false) {
        const [op, arg] = line.split(' ')
        if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        if (!this.next) return
        if (this.next.op === op && (!arg || this.next.arg === arg)) return this.next
        return this.next.nextOp(line)
      },
      prevOp (line, includeSelf = false) {
        const [op, arg] = line.split(' ')
        if (includeSelf && this.op === op && (!arg || this.arg === arg)) return this
        if (!this.previous) return
        if (this.previous.op === op && (!arg || this.previous.arg === arg)) return this.previous
        return this.previous.prevOp(line)
      }
    })
    return line
  }).filter(l => !!l)
  for (let i = 0; i < lines.length - 1; i++) lines[i].next = lines[i + 1]
  for (let i = 1; i < lines.length; i++) lines[i].previous = lines[i - 1]
  return {code, lines, calls, internalCalls, fields, internalFields, consts}
}
