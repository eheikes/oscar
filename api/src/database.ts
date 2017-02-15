import * as SequelizeStatic from 'sequelize';
import { Instance, Options as SequelizeOptions, Sequelize } from 'sequelize';

export interface CollectorAttributes {
  id: string;
  name: string;
  Logs?: CollectorLogAttributes[]
}

export interface CollectorInstance extends Instance<CollectorAttributes> {
  dataValues: CollectorAttributes;
}

interface CollectorModel extends SequelizeStatic.Model<CollectorInstance, CollectorAttributes> {}

export interface CollectorLogAttributes {
  id: number;
  timestamp: Date;
  log: string;
  numErrors: number;
}

export interface CollectorLogInstance extends Instance<CollectorLogAttributes> {
  dataValues: CollectorLogAttributes;
}

interface CollectorLogModel extends SequelizeStatic.Model<CollectorLogInstance, CollectorLogAttributes> {}

export interface ItemAttributes {
  id: number;
  url: string;
  title: string;
  author: string|null;
  summary: string|null;
  length: number|null;
  rating: number|null;
  due: Date|null;
  rank: number;
  expectedRank: number|null;
  categories: string;
  createdAt: Date;
  deletedAt: Date|null;
}

export interface ItemInstance extends Instance<ItemAttributes> {
  dataValues: ItemAttributes;
}

interface ItemModel extends SequelizeStatic.Model<ItemInstance, ItemAttributes> {}

export interface TypeAttributes {
  id: string;
  readable: string|null;
}

export interface TypeInstance extends Instance<TypeAttributes> {
  dataValues: TypeAttributes;
}

interface TypeModel extends SequelizeStatic.Model<TypeInstance, TypeAttributes> {}

export interface DatabaseConfig extends SequelizeOptions {
  name: string;
  host: string;
  user: string;
  password: string;
  type: string;
}

export class Database {
  sequelize: Sequelize;
  ready: Promise<any>;

  collectors: CollectorModel;
  collectorLogs: CollectorLogModel;
  items: ItemModel;
  types: TypeModel;

  constructor(config: DatabaseConfig) {
    this.sequelize = new SequelizeStatic(
      config.name,
      config.user,
      config.password,
      Object.assign({ dialect: config.type }, config)
    );

    this.collectors = this.sequelize.define<CollectorInstance, CollectorAttributes>('collectors', {
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

    this.collectorLogs = this.sequelize.define<CollectorLogInstance, CollectorLogAttributes>('collector_logs', {
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

    var summaryLength = 1000;
    this.items = this.sequelize.define<ItemInstance, ItemAttributes>('items', {
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

    this.types = this.sequelize.define<TypeInstance, TypeAttributes>('types', {
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
