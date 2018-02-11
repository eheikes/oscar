import { BaseModel } from './base-model'

const name = 'Type'

const schema: OscarModelSchema = {
  id: { type: String, default: '', null: false },
  readable: { type: String, default: null }
}

export class TypeModel extends BaseModel {
  constructor (db: any) {
    super(db, name, schema)
  }
}
