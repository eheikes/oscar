import { BaseModel } from './base-model'

const name = 'Type'

const schema: OscarModelSchema = {
  id: { type: String, default: '', null: false },
  readable: { type: String, default: null, limit: 255 }
}

export class TypeModel extends BaseModel {
  constructor (db: any) {
    super(db, name, schema)
  }
}