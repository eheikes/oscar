import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { SourceLogModel } from '../../src/models/source-log-model'

describe('Source Log model', () => {
  let db
  let model: SourceLogModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new SourceLogModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(SourceLogModel))
  })
})
