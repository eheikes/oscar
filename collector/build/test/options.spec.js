"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("../src/options");
describe('options', () => {
    describe('allOptions', () => {
        it('should be defined', () => {
            expect(options_1.allOptions).toEqual(jasmine.any(Object));
        });
    });
    describe('parseArguments', () => {
        it('should parse an array of CLI arguments', () => {
            const actual = options_1.parseArguments(['--count', '7']);
            expect(actual.c).toBe(7);
            expect(actual.count).toBe(7);
        });
        it('should use the default options', () => {
            const actual = options_1.parseArguments([]);
            expect(actual.c).toBe(options_1.allOptions.count.default);
            expect(actual.count).toBe(options_1.allOptions.count.default);
        });
    });
});
