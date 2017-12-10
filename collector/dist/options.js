"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const allOptions = {
    count: {
        alias: 'c',
        default: 5,
        describe: 'number of sources to poll',
        number: true,
    }
};
exports.allOptions = allOptions;
const parseArgs = (args) => {
    return yargs
        .options(allOptions)
        .parse(args);
};
exports.parseArguments = parseArgs;
