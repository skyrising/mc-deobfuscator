import EventEmitter from 'events'
import zlib from 'zlib'
import PushStream from 'zen-push'
import util from 'util'

const debug = require('debug')('jar')

const COMPRESSION_DEFLATE = 8

const STATE_READY = 1
const STATE_FILE = 2
const STATE_FILE_DD = 3

const STATE_NAMES = ['invalid', 'READY', 'FILE', 'FILE_DD']

class ZipEntry {
  constructor (reader) {
    this.reader = reader
  }

  accept () {
    debug('accepted %o', this)
    this.accepted = true
    return this.reader.fileStream
  }

  ignore () {
    debug('ignored %o', this)
    this.ignored = true
    if (this.reader.file.filename === this.filename) {
      this.reader.fileDecompresser.on('error', (e) => {})
      this.reader.fileDecompresser.end()
      this.reader.fileDecompresser = null
      this.reader.fileStream = null
    }
  }

  getBytes () {
    const stream = this.accept()
    const buffers = []
    let length = 0
    return new Promise((resolve, reject) => {
      stream.on('data', data => {
        buffers.push(data)
        length += data.length
      })
      stream.on('error', reject)
      stream.on('end', () => {
        resolve(Buffer.concat(buffers, length))
      })
    })
  }

/*
  [util.inspect.custom] (depth, options) {
    return 'ZipEntry ' + util.inspect({
      filename: this.filename,
      compressedSize: this.compressedSize,
      uncompressedSize: this.uncompressedSize
    })
  }
*/
}

class ZipReader extends EventEmitter {
  constructor (readable) {
    super()
    this.buf = null
    this.state = STATE_READY
    this.fileDecompresser = null
    this.fileStream = null
    this.fileRemaining = 0
    this.file = null
    this.offset = 0
    readable.on('data', (data) => this.onData(data))
    readable.on('end', () => {
      if (this.ended) return
      this.ended = true
      this.onData()
    })
  }

  [util.inspect.custom] (depth, options) {
    return options.stylize('ZipReader[' + STATE_NAMES[this.state] + ']', 'special')
  }

  onData (data) {
    if (data) this.buf = this.buf ? Buffer.concat([this.buf, data]) : data
    while (this.buf && this.buf.length) {
      if (this.ended && this.buf.length < 4) throw Error('Reached end with bytes remaining: ' + this.buf)
      // debug('read loop: %d remaining, %s', this.buf.length, STATE_NAMES[this.state])
      if (this.state === STATE_READY && this.buf.length >= 4) {
        const signature = this.buf.readUInt32LE(0)
        switch (signature) {
          case 0x04034b50:
            if (!this.readFileHeader()) return
            break
          case 0x08074b50:
            if (!this.readDataDescriptor()) return
            break
          case 0x02014b50:
            if (!this.readCDfileHeader()) return
            break
          case 0x06054b50:
            if (!this.readEndOfCD()) return
            break
          default:
            // console.warn(`Unknown signature 0x${signature.toString(16)} @0x${this.offset.toString(16)}`)
            this.skip(1)
        }
      } else if (this.state === STATE_FILE) {
        debug('reading file: %d remaining, %d in buf', this.fileRemaining, this.buf.length)
        this.fileData(this.buf.slice(0, this.fileRemaining))
        const fileRemaining = this.fileRemaining - this.buf.length
        this.skip(this.fileRemaining)
        this.fileRemaining = fileRemaining < 0 ? 0 : fileRemaining
        if (this.fileRemaining === 0) {
          this.file = null
          if (this.fileDecompresser) this.fileDecompresser.end()
          this.fileStream = null
          this.transition(STATE_READY)
        }
      } else if (this.state === STATE_FILE_DD && this.buf.length >= 4) {
        let ddPos = this.buf.length
        let ddPresent = false
        for (let i = 0; i < this.buf.length; i++) {
          if (this.buf[i] !== 0x50) continue
          if (i > this.buf.length - 4) {
            ddPos = i
            break
          }
          if (this.buf.readUInt32LE(i) !== 0x08074b50) continue
          ddPos = i
          ddPresent = true
          break
        }
        // debug('file_dd: %d in buf, reading %d, ddPresent: %s', this.buf.length, ddPos, ddPresent)
        this.fileData(this.buf.slice(0, ddPos))
        this.skip(ddPos)
        if (ddPresent) {
          this.file = null
          if (this.fileDecompresser) this.fileDecompresser.end()
          this.fileStream = null
          this.transition(STATE_READY)
        }
      } else return
    }
    debug('Buffer empty')
    if (this.ended) this.emit('end')
  }

  transition (state) {
    debug('%s -> %s', STATE_NAMES[this.state], STATE_NAMES[state])
    this.state = state
  }

  skip (num) {
    this.buf = this.buf.slice(num)
    this.offset += num
  }

  readFileHeader () {
    if (this.buf.length < 30) return false
    const buf = this.buf
    const entry = new ZipEntry(this)
    entry.version = buf.readUInt16LE(4)
    entry.flags = buf.readUInt16LE(6)
    entry.compressionMethod = buf.readUInt16LE(8)
    entry.lastModifiedTime = buf.readUInt16LE(10)
    entry.lastModifiedDate = buf.readUInt16LE(12)
    entry.crc = buf.readUInt32LE(14)
    entry.compressedSize = buf.readUInt32LE(18)
    entry.uncompressedSize = buf.readUInt32LE(22)
    entry.filenameLength = buf.readUInt16LE(26)
    entry.extraFieldLength = buf.readUInt16LE(28)
    if (buf.length < 30 + entry.filenameLength + entry.extraFieldLength) return false
    entry.filename = buf.slice(30, 30 + entry.filenameLength).toString('utf8')
    entry.extraField = {}
    let extraRead = 0
    while (extraRead < entry.extraFieldLength) {
      const index = buf.readUInt16LE(30 + extraRead + 0)
      const length = buf.readUInt16LE(30 + extraRead + 2)
      entry.extraField[index] = buf.slice(30 + extraRead + 4,
        30 + extraRead + 4 + length)
      extraRead += 4 + length
    }
    this.skip(30 + entry.filenameLength + entry.extraFieldLength)
    this.fileRemaining = entry.compressedSize
    entry.compressedRead = 0
    this.file = entry
    switch (entry.compressionMethod) {
      case COMPRESSION_DEFLATE:
        this.fileDecompresser = zlib.createInflateRaw()
        this.fileStream = this.fileDecompresser
        break
    }
    debug('fileHeader %o', entry)
    this.emit('fileHeader', entry)
    this.transition(entry.flags & 8 ? STATE_FILE_DD : STATE_FILE)
    return true
  }

  readDataDescriptor () {
    if (this.buf.length < 16) return false
    const dd = {
      crc: this.buf.readUInt32LE(4),
      uncompressedSize: this.buf.readUInt32LE(8),
      compressedSize: this.buf.readUInt32LE(12)
    }
    this.emit('dataDescriptor', dd)
    debug('dataDescriptor %o', dd)
    this.skip(16)
    return true
  }

  readCDfileHeader () {
    if (this.buf.length < 46) return
    const buf = this.buf
    const cdfh = {}
    cdfh.versionCreator = buf.readUInt16LE(4)
    cdfh.version = buf.readUInt16LE(6)
    cdfh.flags = buf.readUInt16LE(8)
    cdfh.compression_method = buf.readUInt16LE(10)
    cdfh.lastModifiedTime = buf.readUInt16LE(12)
    cdfh.lastModifiedDate = buf.readUInt16LE(14)
    cdfh.crc = buf.readUInt32LE(16)
    cdfh.compressedSize = buf.readUInt32LE(20)
    cdfh.uncompressedSize = buf.readUInt32LE(24)
    cdfh.filenameLength = buf.readUInt16LE(28)
    cdfh.extraFieldLength = buf.readUInt16LE(30)
    cdfh.commentLength = buf.readUInt16LE(32)
    cdfh.disk = buf.readUInt16LE(34)
    cdfh.internalFileAttributes = buf.readUInt16LE(36)
    cdfh.externalFileAttributes = buf.readUInt32LE(38)
    cdfh.fileHeaderPos = buf.readUInt32LE(42)
    if (buf.length < 46 + cdfh.filenameLength + cdfh.extraFieldLength + cdfh.commentLength) return false
    cdfh.filename = buf.slice(46, 46 + cdfh.filenameLength).toString('utf8')
    cdfh.extraField = buf.slice(46 + cdfh.filenameLength, 46 + cdfh.filenameLength + cdfh.extraFieldLength)
    cdfh.comment = buf.slice(46 + cdfh.filenameLength + cdfh.extraFieldLength, 46 + cdfh.filenameLength + cdfh.extraFieldLength + cdfh.commentLength)
    this.skip(46 + cdfh.filenameLength + cdfh.extraFieldLength + cdfh.commentLength)
    debug('centralDirectoryFileHeader %o', cdfh)
    this.emit('centralDirectoryFileHeader', cdfh)
    return true
  }

  readEndOfCD () {
    if (this.buf.length < 22) return false
    const eocd = {}
    eocd.disk = this.buf.readUInt16LE(4)
    eocd.cdDisk = this.buf.readUInt16LE(6)
    eocd.cdRecordsDisk = this.buf.readUInt16LE(8)
    eocd.cdRecordsTotal = this.buf.readUInt16LE(10)
    eocd.cdSize = this.buf.readUInt32LE(12)
    eocd.cdOffset = this.buf.readUInt32LE(16)
    eocd.commentLength = this.buf.readUInt16LE(20)
    if (this.buf.length < 22 + eocd.commentLength) return false
    eocd.comment = this.buf.slice(22, 22 + eocd.commentLength).toString('utf8')
    this.skip(22 + eocd.commentLength)
    debug('endOfCentralDirectory %o', eocd)
    this.emit('endOfCentralDirectory', eocd)
    return true
  }

  fileData (data) {
    this.file.compressedRead += data.length
    // debug('got file data: %d bytes, ignored: %s, decompressed: %s', data.length, this.file.ignored, !this.file.ignored && this.fileDecompresser)
    if (this.file.ignored) return
    if (this.fileDecompresser) this.fileDecompresser.write(data)
  }
}

export function readZip (readable) {
  return new ZipReader(readable)
}

export function getEntries (readable) {
  const ps = new PushStream()
  const reader = new ZipReader(readable)
  reader.on('fileHeader', entry => {
    ps.next(entry)
  })
  reader.on('error', err => ps.error(err))
  reader.on('end', () => ps.complete())
  return ps.observable
}

export function getClasses (readable) {
  return getEntries(readable).filter(entry => {
    if (entry.filename.endsWith('.class')) return true
    entry.ignore()
    return false
  })
}
