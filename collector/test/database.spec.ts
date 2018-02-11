import { file as tempfile } from 'tempy'
import { TypeModel } from '../src/models/type-model'
import { init, types } from '../src/database'

describe('database', () => {
  describe('before init', () => {
    it('should start with uninitialized models', () => {
      expect(types).toBe(undefined)
    })
  })

  describe('init()', () => {
    it('should create the models', () => {
      init({
        type: 'sqlite3',
        filename: tempfile()
      })
      expect(types).toEqual(jasmine.any(TypeModel))
    })

    it('should use a port when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        port: 123456
      })
      expect(types).toEqual(jasmine.any(TypeModel))
    })

    it('should use a socket when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        socket: 'testSocket'
      })
      expect(types).toEqual(jasmine.any(TypeModel))
    })
  })
})
