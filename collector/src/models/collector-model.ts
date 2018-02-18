import { BaseModel } from './base-model'

const name = 'Collector'

const schema: OscarModelSchema = {
  id: { type: String, default: '', null: false },
  name: { type: String, default: null, limit: 255 }
}

export class CollectorModel extends BaseModel {
  constructor(db: any) {
    super(db, name, schema)
  }
}
