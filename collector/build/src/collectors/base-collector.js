"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid/v4");
class BaseCollector {
    // The constructor for a collector usually takes a URI.
    // It can also take an optional object with options.
    constructor() {
        this.logs = []; // logs in descending order
        // base class does nothing
    }
    get numErrors() {
        if (this.logs.length === 0) {
            return 0;
        }
        return this.logs[0].numErrors;
    }
    addLog(log) {
        this.logs.unshift(log);
    }
    createLog(message = '', numErrors = 0) {
        return {
            id: uuid(),
            timestamp: new Date(),
            log: message,
            numErrors: numErrors
        };
    }
}
exports.BaseCollector = BaseCollector;
