import fs from 'fs'
import { readClasses } from '../../src/util/class-reader'

readClasses(fs.createReadStream('/mnt/data/minecraft/versions/1.13.1.jar')).subscribe({
  async next (cls) {
    // console.log(cls.className)
    if (cls.className === 'a') {
      console.log(cls)
      // for (const md of cls.methods) console.log(md.code)
      // process.exit(0)
    }
  },
  error (e) {
    console.error(e)
    process.exit(1)
  }
})
