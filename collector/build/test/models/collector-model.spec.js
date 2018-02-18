"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const collector_model_1 = require("../../src/models/collector-model");
describe('Collector model', () => {
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new collector_model_1.CollectorModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(collector_model_1.CollectorModel));
    });
});
