#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
const opts = options_1.parseArguments(process.argv.slice(2));
exports.opts = opts;
