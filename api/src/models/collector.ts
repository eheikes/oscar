import * as SequelizeStatic from 'sequelize';
import { Instance } from 'sequelize';
import { CollectorLogAttributes } from './collectorlog';

export interface Collector {
  id: string;
  name: string;
  numErrors: number;
}

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

export const toCollector = (item: CollectorAttributes): Collector => {
  let formattedCollector: Collector = {
    id: item.id,
    name: item.name,
    numErrors: (item.Logs && item.Logs[0] && item.Logs[0].numErrors) || 0,
  };
  return formattedCollector;
};
