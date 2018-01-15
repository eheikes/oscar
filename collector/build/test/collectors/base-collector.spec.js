"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Use the RSS collector to test the base class
const rss_collector_1 = require("../../src/collectors/rss-collector");
describe('Base collector', () => {
    let collector;
    beforeEach(() => {
        collector = new rss_collector_1.RssCollector('test');
    });
    it('should init with an empty log array', () => {
        expect(collector.logs).toEqual([]);
    });
    describe('numErrors', () => {
        it('should return 0 if there are no logs', () => {
            expect(collector.numErrors).toBe(0);
        });
        it('should return the numErrors from the first log', () => {
            const fakeLog1 = {
                numErrors: 3
            };
            const fakeLog2 = {
                numErrors: 5
            };
            collector.logs.push(fakeLog1, fakeLog2);
            expect(collector.numErrors).toBe(fakeLog1.numErrors);
        });
    });
});
