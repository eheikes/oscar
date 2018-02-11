import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { TypeModel } from '../../src/models/type-model'

describe('Type model', () => {
  let db
  let model: TypeModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new TypeModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(TypeModel))
  })
})
