"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
describe('main', () => {
    it('should parse the CLI arguments', () => {
        expect(index_1.opts).toEqual(jasmine.any(Object));
        expect(index_1.opts.$0).toMatch(/jasmine-ts$/);
    });
});
