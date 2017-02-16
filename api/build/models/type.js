"use strict";
const SequelizeStatic = require("sequelize");
exports.typeDefinition = {
    id: {
        type: SequelizeStatic.STRING,
        primaryKey: true
    },
    readable: {
        type: SequelizeStatic.STRING
    }
};
