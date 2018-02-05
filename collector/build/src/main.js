#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
const config_1 = require("./config");
const opts = options_1.parseArguments(process.argv.slice(2));
exports.opts = opts;
console.log('config:', config_1.getConfig(opts._[0]));
