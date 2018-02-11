"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const base_model_1 = require("../../src/models/base-model");
describe('Base model', () => {
    class BareModel extends base_model_1.BaseModel {
        constructor(db) {
            super(db);
        }
    }
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new BareModel(db);
    });
    it('should create a model', () => {
        expect(model).toEqual(jasmine.any(BareModel));
    });
});
