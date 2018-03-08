#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
const config_1 = require("./config");
const database_1 = require("./database");
const opts = options_1.parseArguments(process.argv.slice(2));
exports.opts = opts;
const config = config_1.getConfig(opts._[0]);
// Retrieve the next X sources from the database.
// TODO Mark where we left off.
const getNextXSources = (num) => {
    return database_1.sources.find({ limit: num }).catch(err => {
        // TODO handle error
        console.log('ERROR:', err);
    });
};
exports.getNextXSources = getNextXSources;
/* istanbul ignore if */
if (require.main === module) {
    if (config.database) {
        database_1.init(config.database);
        getNextXSources(opts.count).then(sources => {
            console.log('got sources:', sources);
            process.exit(0);
        }).catch(err => {
            console.log('ERROR:', err); // TODO
            process.exit(1);
        });
    }
}
