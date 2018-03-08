//
// DB ORM abstraction
//
import * as caminte from 'caminte'
import { promisify } from 'util'

export interface WhereOptions {
  [field: string]: string | number
}

export interface FindOptions {
  limit?: number
  offset?: number
  order?: 'asc' | 'desc'
  orderBy?: string
  where?: WhereOptions
}

export abstract class BaseModel implements OscarModel {
  private model: caminte.Model | null = null
  private name: string = 'Base' // DB name
  private schema: OscarModelSchema = {}

  // The constructor for a model should take the caminte schema.
  constructor (
    db: caminte.Schema | null = null,
    name: string | null = null,
    schema: OscarModelSchema = {}
  ) {
    this.name = name === null ? this.constructor.name : name
    this.schema = schema
    if (db !== null) {
      this.model = db.define(this.name, this.convertSchema(this.schema))
    }
  }

  // Retrieves matching records for the model.
  public find (opts: FindOptions = {}): Promise<caminte.Instance[]> {
    return this.checkModel().then(() => {
      return promisify(this.model!.find.bind(this.model))(opts)
    })
  }

  // Maps a Caminte instance to the model's schema.
  protected mapInstanceProps (instance: caminte.Instance): any {
    return Object.keys(this.schema).reduce((soFar: any, key) => {
      soFar[key] = instance[key]
      return soFar
    }, {})
  }

  // Checks if the internal model has been initialized properly.
  private checkModel () {
    if (this.model === null) {
      return Promise.reject(new Error(
        `Model ${this.name} has not yet been initialized with a database schema`
      ))
    }
    return Promise.resolve(this.model)
  }

  // Converts a schema from OSCAR to Caminte.
  private convertSchema (schema: OscarModelSchema): caminte.Properties {
    return schema
  }
}
