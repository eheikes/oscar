"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const defaultConfig = {
    api: {
        name: 'oscar-api',
        protocol: 'http',
        hostname: 'localhost',
        port: 3000,
        pathname: '/'
    },
    database: {
        type: 'sqlite3',
        filename: './oscar.db'
    },
    ranking: {
        numVars: 100,
        numKeywords: 100
    }
};
exports.defaultConfig = defaultConfig;
const getConfig = (filename) => {
    let fileConfig = filename ?
        js_yaml_1.safeLoad(fs_1.readFileSync(filename, 'utf8')) :
        {};
    return Object.assign({}, defaultConfig, fileConfig);
};
exports.getConfig = getConfig;
