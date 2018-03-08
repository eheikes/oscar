import { file as tempfile } from 'tempy'
import { SourceModel } from '../src/models/source-model'
import { SourceLogModel } from '../src/models/source-log-model'
import { ItemModel } from '../src/models/item-model'
import { TypeModel } from '../src/models/type-model'
import {
  init,
  sourceLogs,
  sources,
  items,
  types
} from '../src/database'

describe('database', () => {
  describe('before init()', () => {
    it('should still start with models', () => {
      expect(sourceLogs).toEqual(jasmine.any(SourceLogModel))
      expect(sources).toEqual(jasmine.any(SourceModel))
      expect(items).toEqual(jasmine.any(ItemModel))
      expect(types).toEqual(jasmine.any(TypeModel))
    })
  })

  describe('init()', () => {
    it('should create the models', () => {
      init({
        type: 'sqlite3',
        filename: tempfile()
      })
      // checkModel() is private; this is a hack to get around that
      return Promise.all([
        sourceLogs['checkModel'](),
        sources['checkModel'](),
        items['checkModel'](),
        types['checkModel']()
      ])
    })

    it('should use a port when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        port: 123456
      })
      return Promise.all([
        sourceLogs['checkModel'](),
        sources['checkModel'](),
        items['checkModel'](),
        types['checkModel']()
      ])
    })

    it('should use a socket when specified', () => {
      init({
        type: 'sqlite3',
        filename: tempfile(),
        socket: 'testSocket'
      })
      return Promise.all([
        sourceLogs['checkModel'](),
        sources['checkModel'](),
        items['checkModel'](),
        types['checkModel']()
      ])
    })
  })
})
