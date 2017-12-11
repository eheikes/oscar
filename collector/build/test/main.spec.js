"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../src/main");
describe('main', () => {
    it('should parse the CLI arguments', () => {
        expect(main_1.opts).toEqual(jasmine.any(Object));
        expect(main_1.opts.$0).toMatch(/jasmine-ts$/);
    });
});
