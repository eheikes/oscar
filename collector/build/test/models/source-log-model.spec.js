"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const source_log_model_1 = require("../../src/models/source-log-model");
describe('Source Log model', () => {
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new source_log_model_1.SourceLogModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(source_log_model_1.SourceLogModel));
    });
});
