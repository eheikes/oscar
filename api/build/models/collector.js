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
exports.toCollector = (item) => {
    let formattedCollector = {
        id: item.id,
        name: item.name,
        numErrors: (item.Logs && item.Logs[0] && item.Logs[0].numErrors) || 0,
    };
    return formattedCollector;
};
