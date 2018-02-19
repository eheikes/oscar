import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { SourceModel } from '../../src/models/source-model'

describe('Source model', () => {
  let db
  let model: SourceModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new SourceModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(SourceModel))
  })
})
