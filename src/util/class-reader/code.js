import util from 'util'
import * as io from '../buffer'
import * as CONSTS from './constants'
import { errorCause } from '..'
import { readAttribute } from '.'

const TYPE = ['int', 'long', 'float', 'double', 'object', 'byte', 'char', 'short']

export function parseCode (buf, cp) {
  const pb = { offset: 0, buf }
  const code = { maxStack: io.rb16(pb), maxLocals: io.rb16(pb), lines: [] }
  const codeLength = io.rb32(pb)
  const codeStart = pb.offset
  const codeEnd = codeStart + codeLength
  try {
    const byOffset = []
    while (pb.offset < codeEnd) {
      const op = io.r8(pb)
      const line = {
        offset: pb.offset - codeStart,
        opId: op,
        operands: [],
        [util.inspect.custom] (depth, opts) {
          return `${this.offset.toString(16).padStart(Math.ceil(Math.log2(codeLength + 1) / 4), '0')}: ${this.op}${this.operands.map(o => ' ' + util.inspect(o, opts)).join('')}`
        }
      }
      line.op = CONSTS.OP_NAMES[line.opId]
      if (op === CONSTS.OP_BIPUSH) {
        line.operands.push(line.const = io.r8(pb))
      } else if (op === CONSTS.OP_SIPUSH) {
        line.operands.push(line.const = io.rsb16(pb))
      } else if (op === CONSTS.OP_LDC) {
        line.operands.push(line.const = cp[line.index = io.r8(pb)])
      } else if (op === CONSTS.OP_LDC_W || op === CONSTS.OP_LDC2_W) {
        line.operands.push(line.const = cp[line.index = io.rb16(pb)])
      } else if (op >= CONSTS.OP_ILOAD && op <= CONSTS.OP_ALOAD) {
        line.operands.push(line.load = io.r8(pb))
        line.loadType = TYPE[op - CONSTS.ILOAD]
      } else if (op >= CONSTS.OP_ILOAD_0 && op <= CONSTS.OP_ALOAD_3) {
        line.load = (op - CONSTS.OP_ILOAD_0) & 3
        line.loadType = TYPE[(op - CONSTS.OP_ILOAD_0) >> 2]
      } else if (op >= CONSTS.OP_IALOAD && op <= CONSTS.OP_SALOAD) {
        line.loadType = TYPE[(op - CONSTS.OP_IALOAD)]
      } else if (op >= CONSTS.OP_ISTORE && op <= CONSTS.OP_ASTORE) {
        line.operands.push(line.store = io.r8(pb))
        line.storeType = TYPE[op - CONSTS.OP_ISTORE]
      } else if (op >= CONSTS.OP_ISTORE_0 && op <= CONSTS.OP_ASTORE_3) {
        line.store = (op - CONSTS.OP_ISTORE_0) & 3
        line.storeType = TYPE[(op - CONSTS.OP_ISTORE_0) >> 2]
      } else if (op >= CONSTS.OP_IASTORE && op <= CONSTS.OP_SASTORE) {
        line.storeType = TYPE[(op - CONSTS.OP_IASTORE)]
      } else if (op === CONSTS.OP_IINC) {
        line.operands.push(line.local = io.r8(pb))
        line.operands.push(line.addend = io.rs8(pb))
      } else if ((op >= CONSTS.OP_IFEQ && op <= CONSTS.OP_JSR) || op === CONSTS.OP_IFNULL || op === CONSTS.OP_IFNONNULL) {
        line.operands.push(line.targetOffset = io.rsb16(pb))
      } else if (op >= CONSTS.OP_GETSTATIC && op <= CONSTS.OP_PUTFIELD) {
        line.operands.push(line.field = cp[line.fieldIndex = io.rb16(pb)])
      } else if (op >= CONSTS.OP_INVOKEVIRTUAL && op <= CONSTS.OP_INVOKEDYNAMIC) {
        line.operands.push(line.method = cp[line.methodIndex = io.rb16(pb)])
        if (op === CONSTS.OP_INVOKEINTERFACE) {
          line.operands.push(line.count = io.r8(pb))
          line.operands.push(io.r8(pb))
        } else if (op === CONSTS.OP_INVOKEDYNAMIC) {
          line.operands.push(io.r8(pb))
          line.operands.push(io.r8(pb))
        }
      } else if (op === CONSTS.OP_NEW) {
        line.operands.push(line.type = cp[line.typeIndex = io.rb16(pb)])
      } else if (op === CONSTS.OP_NEWARRAY) {
        line.operands.push(line.type = String.fromCharCode(io.r8(pb)))
      } else if (op === CONSTS.OP_ANEWARRAY || op === CONSTS.OP_CHECKCAST || op === CONSTS.OP_INSTANCEOF) {
        line.operands.push(line.type = cp[line.typeIndex = io.rb16(pb)])
      } else if (op === CONSTS.OP_WIDE) {
        line.operands.push(line.wideOp = io.r8(pb))
        line.operands.push(line.index = io.rb16(pb))
        if (line.wideOp === CONSTS.OP_IINC) line.operands.push(line.addend = io.rb16(pb))
      } else if (op === CONSTS.OP_MULTIANEWARRAY) {
        line.operands.push(line.type = cp[line.typeIndex = io.rb16(pb)])
        line.operands.push(line.dimensions = io.r8(pb))
      } else if (op === CONSTS.OP_GOTO_W || op === CONSTS.OP_JSR_W) {
        line.operands.push(line.targetOffset = io.rsb32(pb))
      } else if (op === CONSTS.OP_TABLESWITCH) {
        io.skip(pb, (4 - pb.offset) & 3)
        line.operands.push(line.default = io.rsb32(pb))
        line.operands.push(line.low = io.rsb32(pb))
        line.operands.push(line.high = io.rsb32(pb))
        if (line.low > line.high) throw new Error(`Tableswitch: low (${line.low}) > high (${line.high})`)
        const num = line.high - line.low + 1
        line.operands.push(line.offsets = Array(num))
        if (!io.has(pb, num * 4)) throw io.error(pb, `Too many offsets for tableswitch: ${num} (low: ${line.low}, high: ${line.high})`)
        for (let i = 0; i < num; i++) line.offsets[i] = io.rsb32(pb)
      } else if (op === CONSTS.OP_LOOKUPSWITCH) {
        io.skip(pb, (4 - pb.offset) & 3)
        line.operands.push(line.default = io.rsb32(pb))
        line.operands.push(line.pairs = Array(io.rb32(pb)))
        for (let i = 0; i < line.pairs.length; i++) {
          line.pairs[i] = {
            match: io.rsb32(pb),
            offset: io.rsb32(pb),
            [util.inspect.custom] (depth, opts) {
              return this.match + ' -> ' + this.offset
            }
          }
        }
      }
      byOffset[line.offset] = line
      code.lines.push(line)
    }
    code.exceptionTableLength = io.rb16(pb)
    code.exceptionTable = Array(code.exceptionTableLength)
    for (let i = 0; i < code.exceptionTableLength; i++) {
      code.exceptionTable[i] = {
        startPC: io.rb16(pb),
        endPC: io.rb16(pb),
        handlerPC: io.rb16(pb),
        catchType: cp[io.rb16(pb)]
      }
    }
    code.attrCount = io.rb16(pb)
    code.attributes = Array(code.attrCount)
    for (let i = 0; i < code.attrCount; i++) code.attributes[i] = readAttribute(pb, cp, code)
    return code
  } catch (e) {
    const lastInstr = code.lines[code.lines.length - 1]
    const lastInstrInfo = lastInstr ? `\nLast instruction: ${util.inspect(lastInstr)} ${util.inspect(lastInstr, { customInspect: false })}` : ''
    throw errorCause(io.error(pb, `Could not parse code:${lastInstrInfo}\nInstructions (${code.lines.length}):\n${code.lines.map(line => util.inspect(line)).join('\n')}`), e)
  }
}
