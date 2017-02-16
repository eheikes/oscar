"use strict";
const SequelizeStatic = require("sequelize");
const collector_1 = require("./models/collector");
const collectorlog_1 = require("./models/collectorlog");
const item_1 = require("./models/item");
const type_1 = require("./models/type");
class Database {
    constructor(config) {
        this.sequelize = new SequelizeStatic(config.name, config.user, config.password, Object.assign({ dialect: config.type }, config));
        this.collectors = this.sequelize.define('collectors', collector_1.collectorDefinition, {
            freezeTableName: true,
            timestamps: false
        });
        this.collectorLogs = this.sequelize.define('collector_logs', collectorlog_1.collectorLogDefinition, {
            freezeTableName: true,
            timestamps: false
        });
        this.items = this.sequelize.define('items', item_1.itemDefinition, {
            freezeTableName: true,
            timestamps: true,
            paranoid: true // adds deletedAt
        });
        this.types = this.sequelize.define('types', type_1.typeDefinition, {
            freezeTableName: true,
            timestamps: false
        });
        this.collectors.hasMany(this.collectorLogs, {
            as: 'Logs',
            constraints: false,
            foreignKey: {
                name: 'collector_id'
            }
        });
        this.collectorLogs.belongsTo(this.collectors, {
            as: 'Collector',
            constraints: false,
            foreignKey: {
                name: 'collector_id'
            }
        });
        this.types.hasMany(this.items, {
            as: 'Items',
            constraints: false,
            foreignKey: {
                name: 'type_id'
            }
        });
        this.items.belongsTo(this.types, {
            as: 'Type',
            constraints: false,
            foreignKey: {
                name: 'type_id'
            }
        });
        this.ready = Promise.all([
            this.collectors.sync(),
            this.collectorLogs.sync(),
            this.items.sync(),
            this.types.sync()
        ]);
    }
}
exports.Database = Database;
