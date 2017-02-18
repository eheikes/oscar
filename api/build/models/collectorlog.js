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
exports.toCollectorLog = (log) => {
    let formattedLog = {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        log: log.log,
        numErrors: log.numErrors,
    };
    return formattedLog;
};
