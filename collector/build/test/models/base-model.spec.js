"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caminte = require("caminte");
const tempy_1 = require("tempy");
const base_model_1 = require("../../src/models/base-model");
describe('Base model', () => {
    const schema = {
        id: { type: Number },
        name: { type: String }
    };
    const items = [
        { id: 1, name: 'foo' },
        { id: 2, name: 'bar' }
    ];
    class BareModel extends base_model_1.BaseModel {
        constructor(db, name) {
            super(db, name, schema);
        }
    }
    let db;
    let model;
    beforeEach(() => {
        db = new caminte.Schema('sqlite3', {
            driver: 'sqlite3',
            database: tempy_1.file()
        });
    });
    describe('constructor', () => {
        describe('when db argument is given', () => {
            beforeEach(() => {
                model = new BareModel(db);
            });
            it('should set an internal model', () => {
                return model['checkModel']();
            });
        });
        describe('when db argument is left out', () => {
            beforeEach(() => {
                model = new BareModel();
            });
            it('should NOT set an internal model', () => {
                return model['checkModel']().then(model => {
                    expect(model).toBeUndefined(); // this should never be reached
                }).catch(err => {
                    expect(err).toBeDefined();
                });
            });
        });
        describe('when name argument is given', () => {
            beforeEach(() => {
                model = new BareModel(db, 'foo');
            });
            it('should set the internal name to that name', () => {
                expect(model['name']).toBe('foo');
            });
        });
        describe('when name argument is left out', () => {
            beforeEach(() => {
                model = new BareModel(db);
            });
            it('should set the internal name to the contructor name', () => {
                expect(model['name']).toBe('BareModel');
            });
        });
    });
    describe('find()', () => {
        describe('when a model has been set', () => {
            beforeEach(() => {
                model = new BareModel(db);
                model['model'].find = jasmine.createSpy('model find').and.callFake((opts, callback) => callback(null, items));
            });
            it('should return the records', () => {
                return model.find().then(results => {
                    expect(results).toEqual(items);
                });
            });
        });
        describe('when a model has NOT been set', () => {
            beforeEach(() => {
                model = new BareModel();
            });
            it('should return a rejected promise', () => {
                return model.find().then(results => {
                    expect(results).toBeUndefined(); // this should never be reached
                }).catch(err => {
                    expect(err).toBeDefined();
                });
            });
        });
    });
    describe('mapInstanceProps()', () => {
        let instance;
        beforeEach(() => {
            model = new BareModel();
            instance = JSON.parse(JSON.stringify(items[0])); // clone it
        });
        it('should map a Caminte instance to the model schema', () => {
            expect(model['mapInstanceProps'](instance)).toEqual(items[0]);
        });
        it('should exclude extra properties', () => {
            instance.extra = 'foobar';
            expect(model['mapInstanceProps'](instance)).toEqual(items[0]);
        });
    });
});
