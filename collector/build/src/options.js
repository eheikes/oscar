"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const allOptions = {
    count: {
        alias: 'c',
        default: 5,
        describe: 'number of sources to poll',
        number: true
    }
};
exports.allOptions = allOptions;
const parseArgs = (args) => {
    return yargs
        .usage('$0 [OPTIONS] [CONFIG_FILE]')
        .options(allOptions)
        .help()
        .version()
        .parse(args);
};
exports.parseArguments = parseArgs;
