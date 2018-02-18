"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base-model");
const name = 'Collector';
const schema = {
    id: { type: String, default: '', null: false },
    name: { type: String, default: null, limit: 255 }
};
class CollectorModel extends base_model_1.BaseModel {
    constructor(db) {
        super(db, name, schema);
    }
}
exports.CollectorModel = CollectorModel;
