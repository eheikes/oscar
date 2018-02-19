import { BaseModel } from './base-model'

const name = 'Source'

const schema: OscarModelSchema = {
  id: { type: Number, autoIncrement: true, null: false },
  name: { type: String, default: null, limit: 255 },
  collector: { type: String, default: null, limit: 255 },
  uri: { type: String, default: null, limit: 255 }
}

export class SourceModel extends BaseModel {
  constructor(db: any) {
    super(db, name, schema)
  }
}
