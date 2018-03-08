import { BaseModel } from './base-model'

const name = 'Items'

const schema: OscarModelSchema = {
  id: { type: Number, autoIncrement: true, null: false },
  name: { type: String, null: false, limit: 255 },
  title: { type: String, null: false, limit: 255 },
  author: { type: String, default: null, limit: 255 },
  summary: { type: String, default: null, limit: 1000 },
  length: { type: Number, default: null },
  rating: { type: Number, default: null, integer: false },
  due: { type: Date, default: null },
  rank: { type: Number, default: null, integer: false },
  expectedRank: { type: Number, default: null, integer: false },
  categories: { type: Set, null: false },
  createdAt: { type: Date, null: false },
  updatedAt: { type: Date, null: false },
  deletedAt: { type: Date, null: false },
  typeId: { type: String, null: false, limit: 255 }
}

export class ItemModel extends BaseModel {
  constructor (db?: any) {
    super(db, name, schema)
  }
}
