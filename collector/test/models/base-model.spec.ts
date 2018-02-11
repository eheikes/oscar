import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { BaseModel } from '../../src/models/base-model'

describe('Base model', () => {
  class BareModel extends BaseModel {
    constructor (db: any) {
      super(db)
    }
  }

  let db
  let model: BareModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new BareModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(BareModel))
  })
})
