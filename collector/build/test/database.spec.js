"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tempy_1 = require("tempy");
const type_model_1 = require("../src/models/type-model");
const database_1 = require("../src/database");
describe('database', () => {
    describe('before init', () => {
        it('should start with uninitialized models', () => {
            expect(database_1.types).toBe(undefined);
        });
    });
    describe('init()', () => {
        it('should create the models', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file()
            });
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
        it('should use a port when specified', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file(),
                port: 123456
            });
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
        it('should use a socket when specified', () => {
            database_1.init({
                type: 'sqlite3',
                filename: tempy_1.file(),
                socket: 'testSocket'
            });
            expect(database_1.types).toEqual(jasmine.any(type_model_1.TypeModel));
        });
    });
});
