"use strict";
const SequelizeStatic = require("sequelize");
exports.collectorLogDefinition = {
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
