import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { CollectorModel } from '../../src/models/collector-model'

describe('Collector model', () => {
  let db
  let model: CollectorModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new CollectorModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(CollectorModel))
  })
})
