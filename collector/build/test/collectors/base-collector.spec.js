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
    describe('addLog()', () => {
        it('should add a log to front of the array', () => {
            let log = collector.createLog();
            collector.addLog(log);
            expect(collector.logs[0]).toBe(log);
        });
    });
    describe('createLog()', () => {
        it('should return a new log', () => {
            let log = collector.createLog();
            expect(log.id).toBeDefined();
            expect(+log.timestamp).toEqual(jasmine.any(Number));
            expect(log.log).toBe('');
            expect(log.numErrors).toBe(0);
        });
        it('should accept a message', () => {
            let log = collector.createLog('test message');
            expect(log.log).toBe('test message');
        });
        it('should accept the number of errors', () => {
            let log = collector.createLog('test message', 5);
            expect(log.log).toBe('test message');
            expect(log.numErrors).toBe(5);
        });
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
