import * as SequelizeStatic from 'sequelize';
import { Instance } from 'sequelize';

export interface CollectorLog {
  id: number;
  timestamp: string;
  log: string;
  numErrors: number;
}

export interface CollectorLogAttributes {
  id: number;
  timestamp: Date;
  log: string;
  numErrors: number;
}

export interface CollectorLogInstance extends Instance<CollectorLogAttributes> {
  dataValues: CollectorLogAttributes;
}

export interface CollectorLogModel extends SequelizeStatic.Model<CollectorLogInstance, CollectorLogAttributes> {}

export const collectorLogDefinition = {
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
};

export const toCollectorLog = (log: CollectorLogAttributes): CollectorLog => {
  let formattedLog: CollectorLog = {
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    log: log.log,
    numErrors: log.numErrors,
  };
  return formattedLog;
};
