#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
const config_1 = require("./config");
const database_1 = require("./database");
const opts = options_1.parseArguments(process.argv.slice(2));
exports.opts = opts;
const config = config_1.getConfig(opts._[0]);
/* istanbul ignore if */
if (require.main === module) {
    if (config.database) {
        database_1.init(config.database);
    }
    process.exit(0);
}
