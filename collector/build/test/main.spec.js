"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/database");
const main_1 = require("../src/main");
describe('main', () => {
    it('should parse the CLI arguments', () => {
        expect(main_1.opts).toEqual(jasmine.any(Object));
        expect(main_1.opts.$0).toMatch(/jasmine-ts/);
    });
    describe('getNextXSources()', () => {
        beforeEach(() => {
            spyOn(database_1.sources, 'find').and.returnValue(Promise.resolve());
        });
        it('should return the specified number of sources', async () => {
            await main_1.getNextXSources(42);
            expect(database_1.sources.find).toHaveBeenCalledWith({ limit: 42 });
        });
    });
});
