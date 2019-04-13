// @flow
import util from 'util'
import { readConstantPool } from './index'
import * as CONSTS from './constants'
import { getMappedClassName } from '../index'
import { parseCode } from './code'

type Mapper = {
  [string]: (Expression, Mapper) => Expression;
}

function deobfuscate (info: FullInfo) {
  return {
    ObjectMember (om, m) {
      const fd = this.objClass in info.class && info.class[this.objClass].fields[this.member]
      return new ObjectMember(this.obj && this.obj.map(m), getMappedClassName(info, this.objClass), fd ? fd.bestName : this.member)
    },
    Cast (cast, m) {
      const type = this.type.startsWith('L') ? getMappedClassName(info, this.type.slice(1, -1)) : this.type
      return new Cast(this.a.map(m), type)
    },
    Call (call, m) {
      const key = this.name + ':' + this.sig
      const md = this.className in info.class && key in info.class[this.className].method && info.class[this.className].method[key]
      return new Call(this.type, getMappedClassName(info, this.className), md ? md.bestName : this.name, this.sig, this.args.map(arg => arg.map(m)))
    },
    JObject (obj, m) {
      const fields = {}
      for (const key in this.fields) fields[key] = this.fields[key].map(m)
      return new JObject(getMappedClassName(info, this.type), fields)
    }
  }
}

export class Expression {
  [util.inspect.custom] () {
    return this.toString()
  }

  toJSON () {
    return this.toString()
  }

  map (m: Mapper) {
    if (m[this.constructor.name]) return m[this.constructor.name].call(this, this)
    throw Error(this.constructor.name + '.map not supported')
  }

  toString (parentPrecedence: number = 0) {
    throw Error(this.constructor.name + '.toString not implemented')
  }

  deobfuscate (info: FullInfo): Expression {
    return this.map(deobfuscate(info))
  }
}

export class Constant extends Expression {
  value: any;

  constructor (value: any) {
    super()
    this.value = value
  }

  map (m: Mapper) {
    if (m.Constant) m.Constant.call(this, this, m)
    return new Constant(this.value)
  }

  toString () {
    return JSON.stringify(this.value)
  }
  
  toJSON () {
    return this.value
  }
}

export class LocalVariable extends Expression {
  name: string;

  constructor (name: string) {
    super()
    this.name = name
  }

  map (m: Mapper) {
    if (m.LocalVariable) return m.LocalVariable.call(this, this, m)
    return new LocalVariable(this.name)
  }

  toString () {
    return this.name
  }
}

export class Operation extends Expression {
  getPrecedence (): number {
    throw Error(this.constructor.name + '.getPrecedence not implemented')
  }

  _toString (): string {
    throw Error(this.constructor.name + '._toString not implemented')
  }

  toString (parentPrecedence: number = 0) {
    if (parentPrecedence > this.getPrecedence()) return `(${this._toString()})`
    return this._toString()
  }
}

export class UnaryOp extends Operation {
  op: string;
  a: Expression;

  constructor (op: string, a: Expression) {
    super()
    this.op = op
    this.a = a
  }

  getPrecedence () {
    if (this.op === '-' || this.op === '+') return 14
    throw Error('Unknown precedence for ' + this.op)
  }

  map (m: Mapper) {
    if (m.UnaryOp) return m.UnaryOp.call(this, this, m)
    return new UnaryOp(this.op, this.a.map(m))
  }

  toString () {
    return `${this.op}${this.a.toString(this.getPrecedence())}`
  }
}

export class Cast extends UnaryOp {
  type: string;

  constructor (a: Expression, type: string) {
    super(`(${type}) `, a)
    this.type = type
  }

  getPrecedence () {
    return 13
  }

  map (m: Mapper) {
    if (m.Cast) return m.Cast.call(this, this, m)
    return new Cast(this.a.map(m), this.type)
  }
}

export class BinaryOp extends Operation {
  op: string;
  a: Expression;
  b: Expression;

  constructor (op: string, a: Expression, b: Expression) {
    super()
    this.op = op
    this.a = a
    this.b = b
  }

  getPrecedence () {
    if (this.op === '*' || this.op === '/' || this.op === '%') return 12
    if (this.op === '+' || this.op === '-') return 11
    if (this.op === '>>' || this.op === '>>>' || this.op === '<<') return 10
    if (this.op === '<' || this.op === '<=' || this.op === '>=' || this.op === '>' || this.op === 'instanceof') return 9
    if (this.op === '==' || this.op === '!=') return 8
    if (this.op === '&') return 7
    if (this.op === '^') return 6
    if (this.op === '|') return 5
    if (this.op === '&&') return 4
    if (this.op === '||') return 3
    throw Error('Unknown precedence for ' + this.op)
  }

  map (m: Mapper) {
    if (m.BinaryOp) return m.BinaryOp.call(this, this, m)
    return new BinaryOp(this.op, this.a.map(m), this.b.map(m))
  }

  _toString () {
    return `${this.a.toString(this.getPrecedence())} ${this.op} ${this.b.toString(this.getPrecedence())}`
  }
}

export class ObjectMember extends Operation {
  obj: ?Expression;
  objClass: string;
  member: string;

  constructor (obj: ?Expression, objClass: string, member: string) {
    super()
    this.obj = obj
    this.objClass = objClass
    this.member = member
  }

  getPrecedence () {
    return 16
  }

  map (m: Mapper) {
    if (m.ObjectMember) return m.ObjectMember.call(this, this, m)
    return new ObjectMember(this.obj && this.obj.map(m), this.objClass, this.member)
  }

  _toString () {
    if (!this.obj) return `${this.objClass.slice(this.objClass.lastIndexOf('/') + 1)}.${this.member}`
    return `${this.obj.toString(this.getPrecedence())}.${this.member}`
  }
}

export class ArrayMember extends Operation {
  array: Expression;
  index: Expression;

  constructor (array: Expression, index: Expression) {
    super()
    this.array = array
    this.index = index
  }

  getPrecedence () {
    return 16
  }

  map (m: Mapper) {
    if (m.ArrayMember) return m.ArrayMember.call(this, this, m)
    return new ArrayMember(this.array.map(m), this.index.map(m))
  }

  _toString () {
    return `${this.array.toString(this.getPrecedence())}[${this.index.toString(this.getPrecedence())}]`
  }
}

export class Call extends Operation {
  type: string;
  className: string;
  name: string;
  sig: string;
  args: Array<Expression>;

  constructor (type: string, className: string, name: string, sig: string, args: Array<Expression>) {
    super()
    this.type = type
    this.className = className
    this.name = name
    this.sig = sig
    this.args = args
  }

  getPrecedence () {
    return 16
  }

  map (m: Mapper) {
    if (m.Call) return m.Call.call(this, this, m)
    return new Call(this.type, this.className, this.name, this.sig, this.args.map(a => a.map(m)))
  }

  _toString () {
    const argStrings = this.args.map(arg => arg.toString(this.getPrecedence()))
    if (this.type !== 'invokestatic') {
      return `${argStrings[0]}.${this.name}(${argStrings.slice(1).join(', ')})`
    }
    return `${this.className}.${this.name}(${argStrings.join(', ')})`
  }
}

export class JObject extends Expression {
  type: string;
  fields: {[string]: Expression} = {}

  constructor (type: string) {
    super()
    this.type = type
  }

  map (m: Mapper) {
    if (m.JObject) return m.JObject.call(this, this, m)
    const fields = {}
    for (const key in this.fields) fields[key] = this.fields[key].map(m)
    return new JObject(this.type, fields)
  }
  
  toString() {
    return `[${this.type} ${JSON.stringify(this.fields, null, 2)}]`
  }
  
  toJSON () {
    return this.fields
  }
}

export default class Interpreter {
  code: Buffer;
  cp: Array<any>;
  handlers: {[string]: (Interpreter) => any} = {};
  stack: Array<Expression> = [];
  registers: Array<Expression> = [];
  lvt: Array<string> = [];
  pc: number = 0;

  constructor (code: Buffer, cp: Buffer) {
    this.code = code
    this.cp = readConstantPool({ buf: cp, offset: 0 })
  }

  _load (index: number) {
    if (!this.registers[index]) {
      if (this.lvt[index]) this.registers[index] = new LocalVariable(this.lvt[index])
      else this.registers[index] = new LocalVariable('lvt_' + index)
    }
    return this.registers[index]
  }

  _store (index: number, expr: Expression) {
    this.registers[index] = expr
  }

  _unaryOp (type: number, op: string) {
    const a = this.stack.pop()
    if (type === 2) this.stack.pop()
    const result = new UnaryOp(op, a)
    this.stack.push(result)
    if (type === 2) this.stack.push(result)
  }

  _binaryOp (type: number, op: string) {
    const b = this.stack.pop()
    if (type === 2) this.stack.pop()
    const a = this.stack.pop()
    if (type === 2) this.stack.pop()
    const result = new BinaryOp(op, a, b)
    this.stack.push(result)
    if (type === 2) this.stack.push(result)
  }

  _call (type: string, md: any) {
    const className = md.class.value.value
    const sig = md.nameAndType.descriptor.value
    const name = md.nameAndType.name.value
    const argLengths = []
    if (type !== 'invokestatic') argLengths.push(1)
    let retType = ''
    for (let i = 1; i < sig.length; i++) {
      const c = sig[i]
      if (c === ')') {
        retType = sig.slice(i + 1)
        break
      }
      if (c === 'J' || c === 'D') argLengths.push(2)
      else if (c === 'L') {
        argLengths.push(1)
        i = sig.indexOf(';', i)
      } else argLengths.push(1)
    }
    const args = []
    for (let i = argLengths.length - 1; i >= 0; i--) {
      args.push(this.stack.pop())
      if (argLengths[i] === 2) this.stack.pop()
    }
    let ret = new Call(type, className, name, sig, args.reverse())
    if (type in this.handlers) {
      ret = this.handlers[type](this, ret) || ret
    }
    this.stack.push(ret)
    if (retType === 'J' || retType === 'D') this.stack.push(ret)
  }

  run () {
    const codeLength = this.code.readUInt32BE(4)
    const code = this.code.slice(8, 8 + codeLength)
    while (this.pc < code.length) {
      const op = code[this.pc++]
      if (op === CONSTS.OP_NOP) {
        // nop...
      } else if (op === CONSTS.OP_ACONST_NULL) {
        this.stack.push(new Constant(null))
      } else if (op >= CONSTS.OP_ICONST_M1 && op <= CONSTS.OP_ICONST_5) {
        this.stack.push(new Constant(op - CONSTS.OP_ICONST_0))
      } else if (op >= CONSTS.OP_LCONST_0 && op <= CONSTS.OP_LCONST_1) {
        const value = new Constant(op - CONSTS.OP_LCONST_0)
        this.stack.push(value, value)
      } else if (op >= CONSTS.OP_FCONST_0 && op <= CONSTS.OP_FCONST_2) {
        this.stack.push(new Constant(op - CONSTS.OP_FCONST_0))
      } else if (op >= CONSTS.OP_DCONST_0 && op <= CONSTS.OP_DCONST_1) {
        const value = new Constant(op - CONSTS.OP_DCONST_0)
        this.stack.push(value, value)
      } else if (op === CONSTS.OP_BIPUSH) {
        this.stack.push(new Constant(code.readInt8(this.pc++)))
      } else if (op === CONSTS.OP_SIPUSH) {
        this.stack.push(new Constant(code.readInt16BE(this.pc)))
        this.pc += 2
      } else if (op === CONSTS.OP_LDC) {
        this.stack.push(new Constant(this.cp[code.readInt8(this.pc++)]))
      } else if (op === CONSTS.OP_LDC_W || op === CONSTS.OP_LDC2_W) {
        this.stack.push(new Constant(this.cp[code.readInt16BE(this.pc)]))
        this.pc += 2
      } else if (op >= CONSTS.OP_ILOAD && op <= CONSTS.OP_ALOAD) {
        const value = this._load(code.readInt8(this.pc++))
        this.stack.push(value)
        if ((op - CONSTS.OP_ILOAD) & 1) this.stack.push(value)
      } else if (op >= CONSTS.OP_ILOAD_0 && op <= CONSTS.OP_ALOAD_3) {
        const value = this._load((op - CONSTS.OP_ILOAD_0) & 3)
        this.stack.push(value)
        if ((op - CONSTS.OP_ILOAD_0) & 4) this.stack.push(value)
      } else if (op >= CONSTS.OP_IALOAD && op <= CONSTS.OP_SALOAD) {
        const index = this.stack.pop()
        const array = this.stack.pop()
        const result = new ArrayMember(array, index)
        this.stack.push(result)
        if (op === CONSTS.OP_LALOAD || op === CONSTS.DALOAD) this.stack.push(result)
      } else if (op >= CONSTS.OP_ISTORE && op <= CONSTS.OP_ASTORE) {
        if ((op - CONSTS.OP_ISTORE) & 1) this.stack.pop()
        this._store(code.readInt8(this.pc++), this.stack.pop())
      } else if (op >= CONSTS.OP_ISTORE_0 && op <= CONSTS.OP_ASTORE_3) {
        if ((op - CONSTS.OP_ISTORE_0) & 4) this.stack.pop()
        this._store((op - CONSTS.OP_STORE_0) & 3, this.stack.pop())
      } else if (op === CONSTS.OP_POP) {
        this.stack.pop()
      } else if (op === CONSTS.OP_POP2) {
        this.stack.pop()
        this.stack.pop()
      } else if (op === CONSTS.OP_DUP || op === CONSTS.OP_F2D) {
        this.stack.push(this.stack[this.stack.length - 1])
      } else if (op === CONSTS.OP_DUP_X1) {
        const value1 = this.stack.pop()
        const value2 = this.stack.pop()
        this.stack.push(value1, value2, value1)
      } else if (op === CONSTS.OP_DUP_X2) {
        const value1 = this.stack.pop()
        const value2 = this.stack.pop()
        const value3 = this.stack.pop()
        this.stack.push(value1, value3, value2, value1)
      } else if (op === CONSTS.OP_DUP2) {
        const value1 = this.stack.pop()
        const value2 = this.stack.pop()
        this.stack.push(value2, value1, value2, value1)
      } else if (op === CONSTS.OP_DUP2_X1) {
        const value1 = this.stack.pop()
        const value2 = this.stack.pop()
        const value3 = this.stack.pop()
        this.stack.push(value2, value1, value3, value2, value1)
      } else if (op === CONSTS.OP_DUP2_X2) {
        const value1 = this.stack.pop()
        const value2 = this.stack.pop()
        const value3 = this.stack.pop()
        const value4 = this.stack.pop()
        this.stack.push(value2, value1, value4, value3, value2, value1)
      } else if (op === CONSTS.OP_SWAP) {
        const value1 = this.stack.pop()
        const value2 = this.stack.pop()
        this.stack.push(value1, value2)
      } else if (op >= CONSTS.OP_IADD && op <= CONSTS.OP_DREM) {
        const type = 1 + (op & 1)
        const binOp = ['+', '-', '*', '/', '%'][(op - CONSTS.OP_IADD) >> 2]
        this._binaryOp(type, binOp)
      } else if (op >= CONSTS.OP_INEG && op <= CONSTS.OP_DNEG) {
        const type = 1 + (op & 1)
        this._unaryOp(type, '-')
      } else if (op >= CONSTS.OP_ISHL && op <= CONSTS.OP_LXOR) {
        const type = 1 + (op & 1)
        const binOp = ['<<', '>>>', '>>', '&', '|', '^'][(op - CONSTS.OP_ISHL) >> 1]
        this._binaryOp(type, binOp)
      } else if (op === CONSTS.OP_IINC) {
        this.stack.push(new BinaryOp('+', this.stack.pop(), new Constant(1)))
      } else if (op >= CONSTS.OP_I2L && op <= CONSTS.OP_I2S) {
        const from = CONSTS.OP_CONVERSION_FROM[op - CONSTS.OP_I2L]
        const to = CONSTS.OP_CONVERSION_TO[op - CONSTS.OP_I2L]
        if (from === 'J' || from === 'D') this.stack.pop()
        const value = new Cast(this.stack.pop(), CONSTS.JAVA_TYPE[to])
        this.stack.push(value)
        if (to === 'J' || to === 'D') this.stack.push(value)
      } else if (op >= CONSTS.OP_IRETURN && op <= CONSTS.OP_ARETURN) {
        if (op & 1) this.stack.pop()
        return this.stack.pop()
      } else if (op === CONSTS.OP_RETURN) {
        return
      } else if (op === CONSTS.OP_GETSTATIC) {
        const field = this.cp[code.readInt16BE(this.pc)]
        this.pc += 2
        const result = new ObjectMember(null, field.class.value.value, field.nameAndType.name.value)
        this.stack.push(result)
        const sig = field.nameAndType.descriptor.value
        if (sig === 'L' || sig === 'D') this.stack.push(result)
      } else if (op === CONSTS.OP_GETFIELD) {
        const field = this.cp[code.readInt16BE(this.pc)]
        this.pc += 2
        const obj = this.stack.pop()
        const fieldName = field.class.value.value
        let result
        if (fieldName in obj.fields) {
          result = obj.fields[fieldName]
        } else {
          const result = new ObjectMember(obj, field.class.value.value, field.nameAndType.name.value)
        }
        this.stack.push(result)
        const sig = field.nameAndType.descriptor.value
        if (sig === 'L' || sig === 'D') this.stack.push(result)
      } else if (op >= CONSTS.OP_INVOKEVIRTUAL && op <= CONSTS.OP_INVOKEINTERFACE) {
        const md = this.cp[code.readInt16BE(this.pc)]
        this.pc += 2
        if (op === CONSTS.OP_INVOKEINTERFACE) this.pc += 2
        this._call(CONSTS.OP_NAMES[op], md)
      } else if (op === CONSTS.OP_NEW) {
        this.stack.push(new JObject(this.cp[code.readInt16BE(this.pc)].value.value))
        this.pc += 2
      } else {
        console.error(parseCode(this.code, this.cp))
        throw Error(`${this.pc}: ${CONSTS.OP_NAMES[op] || ('op code ' + op)} is not implemented`)
      }
    }
    throw Error('Ran out of code')
  }
}
