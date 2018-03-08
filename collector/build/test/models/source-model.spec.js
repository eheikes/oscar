"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const base_model_1 = require("../../src/models/base-model");
const source_model_1 = require("../../src/models/source-model");
describe('Source model', () => {
    const items = [{
            id: 1,
            name: 'foo',
            collector: 'rss',
            uri: 'http://example.com'
        }];
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
        model = new source_model_1.SourceModel(db);
    });
    describe('constructor', () => {
        it('should create a model', () => {
            expect(model).toEqual(jasmine.any(source_model_1.SourceModel));
        });
    });
    describe('find()', () => {
        beforeEach(() => {
            base_model_1.BaseModel.prototype.find = jasmine.createSpy('model find').and.returnValue(Promise.resolve(items));
        });
        it('should return records mapped to the model', () => {
            return model.find().then(results => {
                expect(results).toEqual([{
                        name: items[0].name,
                        type: items[0].collector,
                        uri: items[0].uri
                    }]);
            });
        });
    });
});
