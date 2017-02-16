"use strict";
const SequelizeStatic = require("sequelize");
class Database {
    constructor(config) {
        this.sequelize = new SequelizeStatic(config.name, config.user, config.password, Object.assign({ dialect: config.type }, config));
        this.collectors = this.sequelize.define('collectors', {
            id: {
                type: SequelizeStatic.STRING,
                primaryKey: true
            },
            name: {
                type: SequelizeStatic.STRING,
                allowNull: false
            }
        }, {
            freezeTableName: true,
            timestamps: false
        });
        this.collectorLogs = this.sequelize.define('collector_logs', {
            timestamp: {
                type: SequelizeStatic.DATE,
                allowNull: false
            },
            log: {
                type: SequelizeStatic.TEXT,
                allowNull: false
            },
            numErrors: {
                type: SequelizeStatic.INTEGER,
                allowNull: false,
                field: 'num_errors'
            }
        }, {
            freezeTableName: true,
            timestamps: false
        });
        const summaryLength = 1000;
        this.items = this.sequelize.define('items', {
            url: {
                type: SequelizeStatic.STRING,
                allowNull: false
            },
            title: {
                type: SequelizeStatic.STRING,
                allowNull: false
            },
            author: {
                type: SequelizeStatic.STRING
            },
            summary: {
                type: SequelizeStatic.STRING(summaryLength) // eslint-disable-line new-cap
            },
            length: {
                type: SequelizeStatic.INTEGER
            },
            rating: {
                type: SequelizeStatic.FLOAT
            },
            due: {
                type: SequelizeStatic.DATE
            },
            rank: {
                type: SequelizeStatic.FLOAT
            },
            expectedRank: {
                type: SequelizeStatic.FLOAT,
                field: 'expected_rank'
            },
            categories: {
                type: SequelizeStatic.TEXT,
                allowNull: false
            }
        }, {
            freezeTableName: true,
            timestamps: true,
            paranoid: true // adds deletedAt
        });
        this.types = this.sequelize.define('types', {
            id: {
                type: SequelizeStatic.STRING,
                primaryKey: true
            },
            readable: {
                type: SequelizeStatic.STRING
            }
        }, {
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
