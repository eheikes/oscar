import * as SequelizeStatic from 'sequelize';
import { Instance } from 'sequelize';

export interface TypeAttributes {
  id: string;
  readable: string|null;
}

export interface TypeInstance extends Instance<TypeAttributes> {
  dataValues: TypeAttributes;
}

export interface TypeModel extends SequelizeStatic.Model<TypeInstance, TypeAttributes> {}

export const typeDefinition = {
  id: {
    type: SequelizeStatic.STRING,
    primaryKey: true
  },
  readable: {
    type: SequelizeStatic.STRING
  }
};
