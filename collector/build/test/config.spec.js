"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const config_1 = require("../src/config");
const goodConfigFile = path_1.resolve(__dirname, 'fixtures', 'good-config.yaml');
const badConfigFile = path_1.resolve(__dirname, 'fixtures', 'bad-config.yaml');
describe('config', () => {
    describe('defaultConfig', () => {
        it('should return an object', () => {
            expect(config_1.defaultConfig).toEqual(jasmine.any(Object));
        });
    });
    describe('getConfig()', () => {
        describe('when no filename is passed', () => {
            it('should return the default config', () => {
                expect(config_1.getConfig()).toEqual(config_1.defaultConfig);
            });
        });
        describe('when a filename is passed', () => {
            it('should return the config from that file', () => {
                const dbConfig = config_1.getConfig(goodConfigFile).database;
                expect(dbConfig.type).toBe('exampleType');
                expect(dbConfig.host).toBe('exampleHost');
                expect(dbConfig.user).toBe('exampleUser');
                expect(dbConfig.password).toBe('examplePassword');
                expect(dbConfig.name).toBe('exampleName');
            });
            it('should merge the file\'s config with the default config', () => {
                expect(config_1.getConfig(goodConfigFile).api).toBeDefined();
            });
            it('should throw if the file does not exist / cannot be read', () => {
                expect(() => {
                    config_1.getConfig('nonexistent.yaml');
                }).toThrow();
            });
            it('should throw if the file is not valid YAML', () => {
                expect(() => {
                    config_1.getConfig(badConfigFile);
                }).toThrow();
            });
        });
    });
});
