"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const collector_log_model_1 = require("../../src/models/collector-log-model");
describe('Collector Log model', () => {
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new collector_log_model_1.CollectorLogModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(collector_log_model_1.CollectorLogModel));
    });
});
