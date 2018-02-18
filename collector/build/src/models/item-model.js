"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base-model");
const name = 'Item';
const schema = {
    id: { type: Number, autoIncrement: true, null: false },
    name: { type: String, null: false, limit: 255 },
    title: { type: String, null: false, limit: 255 },
    author: { type: String, default: null, limit: 255 },
    summary: { type: String, default: null, limit: 1000 },
    length: { type: Number, default: null },
    rating: { type: Number, default: null, integer: false },
    due: { type: Date, default: null },
    rank: { type: Number, default: null, integer: false },
    expectedRank: { type: Number, default: null, integer: false },
    categories: { type: Set, null: false },
    createdAt: { type: Date, null: false },
    updatedAt: { type: Date, null: false },
    deletedAt: { type: Date, null: false },
    typeId: { type: String, null: false, limit: 255 },
};
class ItemModel extends base_model_1.BaseModel {
    constructor(db) {
        super(db, name, schema);
    }
}
exports.ItemModel = ItemModel;
