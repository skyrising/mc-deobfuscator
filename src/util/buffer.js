// @flow
import { chunkStr } from '.'

const nullTerminated = (s: string) => s.substr(0, s.indexOf('\0') >= 0 ? s.indexOf('\0') : s.length)

/**
  @typedef {ParseBuffer}
  @property {number} offset
  @property {Buffer} buf
*/
export type ParseBuffer = {
  offset: number;
  buf: Buffer;
}

/**
  Read n bit number
  @param {ParseBuffer} pb
  @param {number} n - Number of bits
  @returns {number}
*/
export function rb (pb: ParseBuffer, n: number, name?: string) {
  const result = pb.buf.readUIntBE(pb.offset, n / 8)
  if (name) start(pb, name)
  pb.offset += n / 8
  if (name) end(pb)
  return result
}

/**
  Read signed n bit number
  @param {ParseBuffer} pb
  @param {number} n - Number of bits
  @returns {number}
*/
export function rsb (pb: ParseBuffer, n: number, name?: string) {
  const result = pb.buf.readIntBE(pb.offset, n / 8)
  if (name) start(pb, name)
  pb.offset += n / 8
  if (name) end(pb)
  return result
}

/**
  Read u8
  @param {ParseBuffer} pb
  @returns {number}
*/
export const r8 = (pb: ParseBuffer, name?: string) => rb(pb, 8, name)
export const rs8 = (pb: ParseBuffer, name?: string) => rsb(pb, 8, name)

/**
  Read u16
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rb16 = (pb: ParseBuffer, name?: string) => rb(pb, 16, name)
export const rsb16 = (pb: ParseBuffer, name?: string) => rsb(pb, 16, name)

/**
  Read u24
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rb24 = (pb: ParseBuffer, name?: string) => rb(pb, 24, name)
export const rsb24 = (pb: ParseBuffer, name?: string) => rsb(pb, 24, name)

/**
  Read u32
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rb32 = (pb: ParseBuffer, name?: string) => rb(pb, 32, name)
export const rsb32 = (pb: ParseBuffer, name?: string) => rsb(pb, 32, name)

/**
  Read u64
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rb64 = (pb: ParseBuffer, name?: string) => {
  if (name) start(pb, name)
  const n = BigInt.asUintN(64, (BigInt(rb32(pb)) << BigInt(32)) | BigInt(rb32(pb)))
  if (name) end(pb)
  return n
}

export const rsb64 = (pb: ParseBuffer, name?: string) => BigInt.asIntN(64, rb64(pb, name))

export const rf32 = (pb: ParseBuffer) => {
  const f = pb.buf.readFloatBE(0)
  pb.offset += 4
  return f
}

export const rf64 = (pb: ParseBuffer) => {
  const f = pb.buf.readDoubleBE(0)
  pb.offset += 8
  return f
}

/**
  Read fixed point 16.16
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rfx32 = (pb: ParseBuffer) => rsb(pb, 32) / 65536

/**
  Read fixed point 2.30
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rfx32_2_30 = (pb: ParseBuffer) => rsb(pb, 32) / 1073741824 // eslint-disable-line camelcase

/**
  Read fixed point 8.8
  @param {ParseBuffer} pb
  @returns {number}
*/
export const rfx16 = (pb: ParseBuffer) => rsb(pb, 16) / 256

/* eslint-disable no-return-assign */
/**
  Read len bytes
  @param {ParseBuffer} pb
  @param {number} len
  @returns {Buffer}
*/
export const bytes = (pb: ParseBuffer, len?: number, name?: string) => {
  if (name) start(pb, name)
  if (len === undefined) len = pb.buf.length - pb.offset
  const startOff = pb.offset
  const endOff = pb.offset += len
  if (name) end(pb)
  return pb.buf.slice(startOff, endOff)
}

/**
  Skip len bytes
  @param {ParseBuffer} pb
  @param {number} len
*/
export function skip (pb: ParseBuffer, len: number) {
  pb.offset += len
}

/**
  Read null-terminated string
  @param {ParseBuffer} pb
  @param {number} [len] - Maximum number of bytes
  @returns {string}
*/
export const rs = (pb: ParseBuffer, len?: number) => nullTerminated(pb.buf.toString('utf8', pb.offset, pb.offset += (len || pb.buf.length - pb.offset)))
/* eslint-enable no-return-assign */

/**
  Read fourcc
  @param {ParseBuffer} pb
  @returns {string}
*/
export const r4cc = (pb: ParseBuffer) => rs(pb, 4).trim()

/**
  Read VarInt
  @param {ParseBuffer} pb
  @returns {number}
*/
export function rv (pb: ParseBuffer) {
  let b
  let len = 0
  let n = 0
  do {
    b = r8(pb)
    len++
    n = (n << 7) | (b & 0x7F)
  } while ((b & 0x80) && len < 4)
  return n
}

/**
  Determine if buffer has len bytes or more left
  @param {ParseBuffer} pb
  @param {number} [len=0] - If not given returns number of bytes left
  @returns {boolean|number}
*/
export const has = (pb: ParseBuffer, len?: number): boolean|number => len ? pb.buf.length - pb.offset >= len : pb.buf.length - pb.offset

export function hexdumpLine (buf: Buffer) {
  return chunkStr(buf.toString('hex'), 2).join(' ') + ' | ' + buf.toString('ascii').replace(/[^ -~]/g, '.')
}

export function error (pb: ParseBuffer, msg: string) {
  const len = pb.buf.length
  if (len > 32) {
    const start = Math.min(len - 32, Math.max(pb.offset - 16, 0))
    const hex = hexdumpLine(pb.buf.slice(start, start + 32))
    if (start === 0) {
      msg += `\nBuffer: ${hex}...\n        ${'   '.repeat(pb.offset - start)}^`
    } else if (start === len - 32) {
      msg += `\nBuffer: ...${hex}\n           ${'   '.repeat(pb.offset - start)}^`
    } else {
      msg += `\nBuffer: ...${hex}...\n           ${'   '.repeat(pb.offset - start)}^`
    }
  } else {
    msg += `\nBuffer: ${hexdumpLine(pb.buf)}\n        ${'   '.repeat(pb.offset)}^`
  }
  if (pb.sections) msg += `\nSections:\n${dump(pb)}`
  return new Error(msg)
}

export function start (pb: ParseBuffer, name: string) {
  if (!pb.currentSection) pb.currentSection = []
  pb.currentSection.push({ start: pb.offset, name, depth: pb.currentSection.length })
}

export function end (pb: ParseBuffer) {
  if (!pb.currentSection || !pb.currentSection.length) return
  if (!pb.sections) pb.sections = []
  const current = pb.currentSection.pop()
  current.end = pb.offset
  pb.sections.push(current)
}

export function dump (pb: ParseBuffer) {
  if (!pb.sections) return ''
  const addrSize = Math.ceil(Math.log2(pb.buf.length + 1) / 4)
  const lines = []
  for (const section of pb.sections.sort((a, b) => a.start === b.start ? a.depth - b.depth : a.start - b.start)) {
    lines.push('  '.repeat(section.depth) + section.start.toString(16).padStart(addrSize, '0') + ': ' + hexdumpLine(pb.buf.slice(section.start, section.end)) + ' | ' + section.name)
  }
  return lines.join('\n')
}
