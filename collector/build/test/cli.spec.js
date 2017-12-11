"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const child_process_1 = require("child_process");
describe('CLI', () => {
    const bin = path.resolve(__dirname, '../build/src/index.js');
    it('script should be executable', () => {
        return new Promise((resolve, reject) => {
            const proc = child_process_1.spawn(bin);
            proc.on('close', code => {
                if (code !== 0) {
                    return reject(new Error(`Binary exited with error code ${code}`));
                }
                resolve();
            });
        });
    });
});
