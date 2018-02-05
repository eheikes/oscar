#!/usr/bin/env node
import { Options, parseArguments } from './options'
import { getConfig } from './config'

const opts: Options = parseArguments(process.argv.slice(2))
console.log('config:', getConfig(opts._[0]))

export { // for testing
  opts
}
