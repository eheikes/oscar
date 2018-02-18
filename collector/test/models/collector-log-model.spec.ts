import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { CollectorLogModel } from '../../src/models/collector-log-model'

describe('Collector Log model', () => {
  let db
  let model: CollectorLogModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new CollectorLogModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(CollectorLogModel))
  })
})
