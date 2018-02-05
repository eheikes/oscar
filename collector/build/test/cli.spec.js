"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
describe('CLI', () => {
    const bin = path_1.resolve(__dirname, '../build/src/main.js');
    it('script should be executable', () => {
        // Note that Windows doesn't support executable flags;
        //   it will only check if the file is visible.
        return util_1.promisify(fs_1.access)(bin, fs_1.constants.X_OK);
    });
});
