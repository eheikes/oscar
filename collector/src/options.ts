import * as yargs from 'yargs'

interface Options extends yargs.Arguments {
  count: number
}

const allOptions = {
  count: {
    alias: 'c',
    default: 5,
    describe: 'number of sources to poll',
    number: true
  }
}

const parseArgs = (args: string[]): Options => {
  return yargs
    .usage('$0 [OPTIONS] [CONFIG_FILE]')
    .options(allOptions)
    .help()
    .version()
    .parse(args) as Options
}

export {
  allOptions,
  Options,
  parseArgs as parseArguments
}
