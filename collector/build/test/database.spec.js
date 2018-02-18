"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tempy_1 = require("tempy");
const collector_model_1 = require("../src/models/collector-model");
const collector_log_model_1 = require("../src/models/collector-log-model");
const item_model_1 = require("../src/models/item-model");
const type_model_1 = require("../src/models/type-model");
const database_1 = require("../src/database");
describe('database', () => {
    describe('before init', () => {
        it('should start with uninitialized models', () => {
            expect(database_1.collectorLogs).toBe(undefined);
            expect(database_1.collectors).toBe(undefined);
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
            expect(database_1.collectorLogs).toEqual(jasmine.any(collector_log_model_1.CollectorLogModel));
            expect(database_1.collectors).toEqual(jasmine.any(collector_model_1.CollectorModel));
            expect(database_1.items).toEqual(jasmine.any(item_model_1.ItemModel));
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
        it('should use a port when specified', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file(),
                port: 123456
            });
            expect(database_1.collectorLogs).toEqual(jasmine.any(collector_log_model_1.CollectorLogModel));
            expect(database_1.collectors).toEqual(jasmine.any(collector_model_1.CollectorModel));
            expect(database_1.items).toEqual(jasmine.any(item_model_1.ItemModel));
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
        it('should use a socket when specified', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file(),
                socket: 'testSocket'
            });
            expect(database_1.collectorLogs).toEqual(jasmine.any(collector_log_model_1.CollectorLogModel));
            expect(database_1.collectors).toEqual(jasmine.any(collector_model_1.CollectorModel));
            expect(database_1.items).toEqual(jasmine.any(item_model_1.ItemModel));
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
    });
});
