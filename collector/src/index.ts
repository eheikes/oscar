#!/usr/bin/env node
import { Options, parseArguments } from './options'

const opts: Options = parseArguments(process.argv.slice(2))

export { // for testing
  opts
}
