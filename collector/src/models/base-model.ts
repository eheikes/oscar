//
// DB ORM abstraction
//
import * as caminte from 'caminte'

export abstract class BaseModel implements OscarModel {
  private model: caminte.Model

  // The constructor for a model should take the caminte schema.
  constructor (
    db: caminte.Schema,
    name: string | null = null,
    schema: OscarModelSchema = {}
  ) {
    if (name === null) {
      name = this.constructor.name
    }
    this.model = db.define(name, this.convertSchema(schema))
  }

  // Converts a schema from Caminte to OSCAR.
  private convertSchema (schema: OscarModelSchema): caminte.Properties {
    return schema
  }
}
