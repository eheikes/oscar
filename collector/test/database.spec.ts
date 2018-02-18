import { file as tempfile } from 'tempy'
import { CollectorModel } from '../src/models/collector-model';
import { CollectorLogModel } from '../src/models/collector-log-model';
import { ItemModel } from '../src/models/item-model';
import { TypeModel } from '../src/models/type-model'
import {
  init,
  collectorLogs,
  collectors,
  items,
  types
} from '../src/database'

describe('database', () => {
  describe('before init', () => {
    it('should start with uninitialized models', () => {
      expect(collectorLogs).toBe(undefined)
      expect(collectors).toBe(undefined)
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
      expect(collectorLogs).toEqual(jasmine.any(CollectorLogModel))
      expect(collectors).toEqual(jasmine.any(CollectorModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })

    it('should use a port when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        port: 123456
      })
      expect(collectorLogs).toEqual(jasmine.any(CollectorLogModel))
      expect(collectors).toEqual(jasmine.any(CollectorModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })

    it('should use a socket when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        socket: 'testSocket'
      })
      expect(collectorLogs).toEqual(jasmine.any(CollectorLogModel))
      expect(collectors).toEqual(jasmine.any(CollectorModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })
  })
})
