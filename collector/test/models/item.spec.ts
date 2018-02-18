import * as caminte from 'caminte'
import { file as tempfile } from 'tempy'
import { ItemModel } from '../../src/models/item-model'

describe('Item model', () => {
  let db
  let model: ItemModel

  beforeEach(() => {
    db = new caminte.Schema('sqlite3', {
      driver: 'sqlite3',
      database: tempfile()
    })
    model = new ItemModel(db)
  })

  it('should create a model', () => {
    expect(model).toEqual(jasmine.any(ItemModel))
  })
})
