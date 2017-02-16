"use strict";
const SequelizeStatic = require("sequelize");
exports.collectorDefinition = {
    id: {
        type: SequelizeStatic.STRING,
        primaryKey: true
    },
    name: {
        type: SequelizeStatic.STRING,
        allowNull: false
    }
};
