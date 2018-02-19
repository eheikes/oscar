import { BaseModel } from './base-model'

const name = 'SourceLog'

const schema: OscarModelSchema = {
  id: { type: Number, autoIncrement: true, null: false },
  timestamp: { type: Date, default: null },
  log: { type: String, limit: 16000 },
  numErrors: { type: Number, default: null },
  sourceId: { type: String, limit: 255, default: null }
}

export class SourceLogModel extends BaseModel {
  constructor(db: any) {
    super(db, name, schema)
  }
}
