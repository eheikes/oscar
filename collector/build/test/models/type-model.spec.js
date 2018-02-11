"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const type_model_1 = require("../../src/models/type-model");
describe('Type model', () => {
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new type_model_1.TypeModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(type_model_1.TypeModel));
    });
});
