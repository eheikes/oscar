"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const item_model_1 = require("../../src/models/item-model");
describe('Item model', () => {
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new item_model_1.ItemModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(item_model_1.ItemModel));
    });
});
