"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tempy_1 = require("tempy");
const source_model_1 = require("../src/models/source-model");
const source_log_model_1 = require("../src/models/source-log-model");
const item_model_1 = require("../src/models/item-model");
const type_model_1 = require("../src/models/type-model");
const database_1 = require("../src/database");
describe('database', () => {
    describe('before init', () => {
        it('should start with uninitialized models', () => {
            expect(database_1.sourceLogs).toBe(undefined);
            expect(database_1.sources).toBe(undefined);
            expect(database_1.items).toBe(undefined);
            expect(database_1.types).toBe(undefined);
        });
    });
    describe('init()', () => {
        it('should create the models', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file()
            });
            expect(database_1.sourceLogs).toEqual(jasmine.any(source_log_model_1.SourceLogModel));
            expect(database_1.sources).toEqual(jasmine.any(source_model_1.SourceModel));
            expect(database_1.items).toEqual(jasmine.any(item_model_1.ItemModel));
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
        it('should use a port when specified', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file(),
                port: 123456
            });
            expect(database_1.sourceLogs).toEqual(jasmine.any(source_log_model_1.SourceLogModel));
            expect(database_1.sources).toEqual(jasmine.any(source_model_1.SourceModel));
            expect(database_1.items).toEqual(jasmine.any(item_model_1.ItemModel));
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
        it('should use a socket when specified', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file(),
                socket: 'testSocket'
            });
            expect(database_1.sourceLogs).toEqual(jasmine.any(source_log_model_1.SourceLogModel));
            expect(database_1.sources).toEqual(jasmine.any(source_model_1.SourceModel));
            expect(database_1.items).toEqual(jasmine.any(item_model_1.ItemModel));
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
    });
});
