#!/usr/bin/env node
import { Options, parseArguments } from './options'
import { getConfig } from './config'
import { init as initDatabase, sources } from './database'

const opts: Options = parseArguments(process.argv.slice(2))
const config = getConfig(opts._[0])

// Retrieve the next X sources from the database.
// TODO Mark where we left off.
const getNextXSources = (num: number) => {
  return sources.find({ limit: num }).catch(err => {
    // TODO handle error
    console.log('ERROR:', err)
  })
}

/* istanbul ignore if */
if (require.main === module) {
  if (config.database) {
    initDatabase(config.database)
    getNextXSources(opts.count).then(sources => {
      console.log('got sources:', sources)
      process.exit(0)
    }).catch(err => {
      console.log('ERROR:', err) // TODO
      process.exit(1)
    })
  }
}

export { // for testing
  getNextXSources,
  opts
}
