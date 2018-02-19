"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base-model");
const name = 'Source';
const schema = {
    id: { type: Number, autoIncrement: true, null: false },
    name: { type: String, default: null, limit: 255 },
    collector: { type: String, default: null, limit: 255 },
    uri: { type: String, default: null, limit: 255 }
};
class SourceModel extends base_model_1.BaseModel {
    constructor(db) {
        super(db, name, schema);
    }
}
exports.SourceModel = SourceModel;
