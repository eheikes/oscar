import * as SequelizeStatic from 'sequelize';
import { Instance } from 'sequelize';
import { CollectorLogAttributes } from './collectorlog';

export interface CollectorAttributes {
  id: string;
  name: string;
  Logs?: CollectorLogAttributes[];
}

export interface CollectorInstance extends Instance<CollectorAttributes> {
  dataValues: CollectorAttributes;
}

export interface CollectorModel extends SequelizeStatic.Model<CollectorInstance, CollectorAttributes> {}

export const collectorDefinition = {
  id: {
    type: SequelizeStatic.STRING,
    primaryKey: true
  },
  name: {
    type: SequelizeStatic.STRING,
    allowNull: false
  }
};
