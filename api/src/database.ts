import * as SequelizeStatic from 'sequelize';
import { Instance, Options as SequelizeOptions, Sequelize } from 'sequelize';
import { CollectorAttributes, collectorDefinition, CollectorInstance, CollectorModel } from './models/collector';
import { CollectorLogAttributes, collectorLogDefinition, CollectorLogInstance, CollectorLogModel } from './models/collectorlog';
import { ItemAttributes, itemDefinition, ItemInstance, ItemModel } from './models/item';
import { TypeAttributes, typeDefinition, TypeInstance, TypeModel } from './models/type';

export interface DatabaseConfig extends SequelizeOptions {
  name: string;
  host: string;
  user: string;
  password: string;
  type: string;
}

export class Database {
  public ready: Promise<any>;
  public collectors: CollectorModel;
  public collectorLogs: CollectorLogModel;
  public items: ItemModel;
  public types: TypeModel;

  private sequelize: Sequelize;

  constructor(config: DatabaseConfig) {
    this.sequelize = new SequelizeStatic(
      config.name,
      config.user,
      config.password,
      Object.assign({ dialect: config.type }, config)
    );

    this.collectors = this.sequelize.define<CollectorInstance, CollectorAttributes>('collectors', collectorDefinition, {
      freezeTableName: true,
      timestamps: false
    });

    this.collectorLogs = this.sequelize.define<CollectorLogInstance, CollectorLogAttributes>('collector_logs', collectorLogDefinition, {
      freezeTableName: true,
      timestamps: false
    });

    this.items = this.sequelize.define<ItemInstance, ItemAttributes>('items', itemDefinition, {
      freezeTableName: true,
      timestamps: true,
      paranoid: true // adds deletedAt
    });

    this.types = this.sequelize.define<TypeInstance, TypeAttributes>('types', typeDefinition, {
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
