import { file as tempfile } from 'tempy'
import { SourceModel } from '../src/models/source-model';
import { SourceLogModel } from '../src/models/source-log-model';
import { ItemModel } from '../src/models/item-model';
import { TypeModel } from '../src/models/type-model'
import {
  init,
  sourceLogs,
  sources,
  items,
  types
} from '../src/database'

describe('database', () => {
  describe('before init', () => {
    it('should start with uninitialized models', () => {
      expect(sourceLogs).toBe(undefined)
      expect(sources).toBe(undefined)
      expect(items).toBe(undefined)
      expect(types).toBe(undefined)
    })
  })

  describe('init()', () => {
    it('should create the models', () => {
      init({
        type: 'sqlite3',
        filename: tempfile()
      })
      expect(sourceLogs).toEqual(jasmine.any(SourceLogModel))
      expect(sources).toEqual(jasmine.any(SourceModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })

    it('should use a port when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        port: 123456
      })
      expect(sourceLogs).toEqual(jasmine.any(SourceLogModel))
      expect(sources).toEqual(jasmine.any(SourceModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })

    it('should use a socket when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        socket: 'testSocket'
      })
      expect(sourceLogs).toEqual(jasmine.any(SourceLogModel))
      expect(sources).toEqual(jasmine.any(SourceModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })
  })
})
