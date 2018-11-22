import * as caminte from 'caminte'
import { BaseModel, FindOptions } from './base-model'

const name = 'Sources'

const schema: OscarModelSchema = {
  id: { type: Number, autoIncrement: true, null: false },
  name: { type: String, default: null, limit: 255 },
  collector: { type: String, default: null, limit: 255 },
  uri: { type: String, default: null, limit: 255 }
}

export class SourceModel extends BaseModel {
  constructor (db?: any) {
    super(db, name, schema)
  }

  public find (opts: FindOptions = {}): Promise<OscarSource[]> {
    return super.find(opts).then(results => results.map(result => this.mapInstanceProps(result)))
  }

  protected mapInstanceProps (instance: caminte.Instance): OscarSource {
    return {
      name: instance.name,
      type: instance.collector,
      uri: instance.uri
    }
  }
}
