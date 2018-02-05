import { access, constants } from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'

describe('CLI', () => {
  const bin = resolve(__dirname, '../build/src/main.js')

  it('script should be executable', () => {
    // Note that Windows doesn't support executable flags;
    //   it will only check if the file is visible.
    return promisify(access)(bin, constants.X_OK)
  })
})
