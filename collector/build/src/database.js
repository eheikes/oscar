"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
// DB abstraction
//
const caminte = require("caminte");
const source_model_1 = require("./models/source-model");
const source_log_model_1 = require("./models/source-log-model");
const item_model_1 = require("./models/item-model");
const type_model_1 = require("./models/type-model");
let db;
exports.sourceLogs = new source_log_model_1.SourceLogModel();
exports.sources = new source_model_1.SourceModel();
exports.items = new item_model_1.ItemModel();
exports.types = new type_model_1.TypeModel();
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
    exports.sourceLogs = new source_log_model_1.SourceLogModel(db);
    exports.sources = new source_model_1.SourceModel(db);
    exports.items = new item_model_1.ItemModel(db);
    exports.types = new type_model_1.TypeModel(db);
};
