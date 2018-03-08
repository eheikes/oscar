"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base-model");
const name = 'SourceLogs';
const schema = {
    id: { type: Number, autoIncrement: true, null: false },
    timestamp: { type: Date, default: null },
    log: { type: String, limit: 16000 },
    numErrors: { type: Number, default: null },
    sourceId: { type: String, limit: 255, default: null }
};
class SourceLogModel extends base_model_1.BaseModel {
    constructor(db) {
        super(db, name, schema);
    }
}
exports.SourceLogModel = SourceLogModel;
