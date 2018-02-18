"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
// DB abstraction
//
const caminte = require("caminte");
const collector_model_1 = require("./models/collector-model");
const collector_log_model_1 = require("./models/collector-log-model");
const item_model_1 = require("./models/item-model");
const type_model_1 = require("./models/type-model");
let db;
const convertConfig = (config) => {
    return {
        driver: config.type,
        host: config.host,
        port: config.port || config.socket ?
            String(config.port || config.socket) :
            undefined,
        username: config.user,
        password: config.password,
        database: config.name || config.filename,
        pool: config.pool,
        ssl: config.ssl
    };
};
exports.init = (config) => {
    const convertedConfig = convertConfig(config);
    db = new caminte.Schema(convertedConfig.driver, convertedConfig);
    exports.collectorLogs = new collector_log_model_1.CollectorLogModel(db);
    exports.collectors = new collector_model_1.CollectorModel(db);
    exports.items = new item_model_1.ItemModel(db);
    exports.types = new type_model_1.TypeModel(db);
};
