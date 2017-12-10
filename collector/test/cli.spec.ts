import * as path from 'path'
import { spawn } from 'child_process'

describe('CLI', () => {
  const bin = path.resolve(__dirname, '../dist/index.js')

  it('script should be executable', () => {
    return new Promise((resolve, reject) => {
      const proc = spawn(bin)
      proc.on('close', code => {
        if (code !== 0) {
          return reject(new Error(`Binary exited with error code ${code}`))
        }
        resolve()
      })
    })
  })
})
