"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base-model");
const name = 'Type';
const schema = {
    id: { type: String, default: '', null: false },
    readable: { type: String, default: null }
};
class TypeModel extends base_model_1.BaseModel {
    constructor(db) {
        super(db, name, schema);
    }
}
exports.TypeModel = TypeModel;
