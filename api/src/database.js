'use strict';

const Sequelize = require('sequelize');

class Database {
  constructor(config) {
    this.sequelize = new Sequelize(
      config.name,
      config.user,
      config.password,
      Object.assign({ dialect: config.type }, config)
    );

    this.collectors = this.sequelize.define('collectors', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      }
    }, {
      freezeTableName: true,
      timestamps: false
    });

    this.collectorLogs = this.sequelize.define('collector_logs', {
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      log: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      numErrors: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'num_errors'
      }
    }, {
      freezeTableName: true,
      timestamps: false
    });

    var summaryLength = 1000;
    this.items = this.sequelize.define('items', {
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      author: {
        type: Sequelize.STRING
      },
      summary: {
        type: Sequelize.STRING(summaryLength) // eslint-disable-line new-cap
      },
      length: {
        type: Sequelize.INTEGER
      },
      rating: {
        type: Sequelize.FLOAT
      },
      due: {
        type: Sequelize.DATE
      },
      rank: {
        type: Sequelize.FLOAT
      },
      expectedRank: {
        type: Sequelize.FLOAT,
        field: 'expected_rank'
      }
    }, {
      freezeTableName: true,
      timestamps: true,
      paranoid: true // adds deletedAt
    });

    this.types = this.sequelize.define('types', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      readable: {
        type: Sequelize.STRING
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

module.exports = Database;
