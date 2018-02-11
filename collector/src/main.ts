#!/usr/bin/env node
import { Options, parseArguments } from './options'
import { getConfig } from './config'
import { init as initDatabase } from './database'

const opts: Options = parseArguments(process.argv.slice(2))
const config = getConfig(opts._[0])

/* istanbul ignore if */
if (require.main === module) {
  if (config.database) {
    initDatabase(config.database)
  }
  process.exit(0)
}

export { // for testing
  opts
}
