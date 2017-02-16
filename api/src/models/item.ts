import * as SequelizeStatic from 'sequelize';
import { Instance } from 'sequelize';

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

export interface ItemModel extends SequelizeStatic.Model<ItemInstance, ItemAttributes> {}

const summaryLength = 1000;
export const itemDefinition = {
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
};
