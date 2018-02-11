"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseModel {
    // The constructor for a model should take the caminte schema.
    constructor(db, name = null, schema = {}) {
        if (name === null) {
            name = this.constructor.name;
        }
        this.model = db.define(name, this.convertSchema(schema));
    }
    // Converts a schema from Caminte to OSCAR.
    convertSchema(schema) {
        return schema;
    }
}
exports.BaseModel = BaseModel;
