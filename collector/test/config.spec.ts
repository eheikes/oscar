import { resolve } from 'path'
import { defaultConfig, getConfig } from '../src/config'

const goodConfigFile = resolve(__dirname, 'fixtures', 'good-config.yaml')
const badConfigFile = resolve(__dirname, 'fixtures', 'bad-config.yaml')

describe('config', () => {
  describe('defaultConfig', () => {
    it('should return an object', () => {
      expect(defaultConfig).toEqual(jasmine.any(Object))
    })
  })

  describe('getConfig()', () => {
    describe('when no filename is passed', () => {
      it('should return the default config', () => {
        expect(getConfig()).toEqual(defaultConfig)
      })
    })

    describe('when a filename is passed', () => {
      it('should return the config from that file', () => {
        const dbConfig = getConfig(goodConfigFile).database
        expect(dbConfig!.type).toBe('exampleType')
        expect(dbConfig!.host).toBe('exampleHost')
        expect(dbConfig!.user).toBe('exampleUser')
        expect(dbConfig!.password).toBe('examplePassword')
        expect(dbConfig!.name).toBe('exampleName')
      })
      it('should merge the file\'s config with the default config', () => {
        expect(getConfig(goodConfigFile).api).toBeDefined()
      })
      it('should throw if the file does not exist / cannot be read', () => {
        expect(() => {
          getConfig('nonexistent.yaml')
        }).toThrow()
      })
      it('should throw if the file is not valid YAML', () => {
        expect(() => {
          getConfig(badConfigFile)
        }).toThrow()
      })
    })
  })
})
