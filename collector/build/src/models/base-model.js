"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
class BaseModel {
    // The constructor for a model should take the caminte schema.
    constructor(db = null, name = null, schema = {}) {
        this.model = null;
        this.name = 'Base'; // DB name
        this.schema = {};
        this.name = name === null ? this.constructor.name : name;
        this.schema = schema;
        if (db !== null) {
            this.model = db.define(this.name, this.convertSchema(this.schema));
        }
    }
    // Retrieves matching records for the model.
    find(opts = {}) {
        return this.checkModel().then(() => {
            return util_1.promisify(this.model.find.bind(this.model))(opts);
        });
    }
    // Maps a Caminte instance to the model's schema.
    mapInstanceProps(instance) {
        return Object.keys(this.schema).reduce((soFar, key) => {
            soFar[key] = instance[key];
            return soFar;
        }, {});
    }
    // Checks if the internal model has been initialized properly.
    checkModel() {
        if (this.model === null) {
            return Promise.reject(new Error(`Model ${this.name} has not yet been initialized with a database schema`));
        }
        return Promise.resolve(this.model);
    }
    // Converts a schema from OSCAR to Caminte.
    convertSchema(schema) {
        return schema;
    }
}
exports.BaseModel = BaseModel;
