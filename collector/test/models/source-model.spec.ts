import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { BaseModel } from '../../src/models/base-model'
import { SourceModel } from '../../src/models/source-model'

describe('Source model', () => {
  const items: caminte.Instance[] = [{
    id: 1,
    name: 'foo',
    collector: 'rss',
    uri: 'http://example.com'
  }]

  let db
  let model: SourceModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new SourceModel(db)
  })

  describe('constructor', () => {
    it('should create a model', () => {
      expect(model).toEqual(jasmine.any(SourceModel))
    })
  })

  describe('find()', () => {
    beforeEach(() => {
      BaseModel.prototype.find = jasmine.createSpy('model find').and.returnValue(Promise.resolve(items))
    })

    it('should return records mapped to the model', () => {
      return model.find().then(results => {
        expect(results).toEqual([{
          name: items[0].name,
          type: items[0].collector,
          uri: items[0].uri
        }])
      })
    })
  })
})
