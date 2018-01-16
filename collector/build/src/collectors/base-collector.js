"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseCollector {
    // The constructor for a collector usually takes a URI.
    // It can also take an optional object with options.
    constructor() {
        this.logs = []; // logs in descending order
    }
    get numErrors() {
        if (this.logs.length === 0) {
            return 0;
        }
        return this.logs[0].numErrors;
    }
}
exports.BaseCollector = BaseCollector;
