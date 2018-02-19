"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const source_model_1 = require("../../src/models/source-model");
describe('Source model', () => {
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new source_model_1.SourceModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(source_model_1.SourceModel));
    });
});
