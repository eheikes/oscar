import { BaseModel } from './base-model'

const name = 'CollectorLog'

const schema: OscarModelSchema = {
  id: { type: Number, autoIncrement: true, null: false },
  timestamp: { type: Date, default: null },
  log: { type: String, limit: 16000 },
  numErrors: { type: Number, default: null },
  collectorId: { type: String, limit: 255, default: null }
}

export class CollectorLogModel extends BaseModel {
  constructor(db: any) {
    super(db, name, schema)
  }
}
