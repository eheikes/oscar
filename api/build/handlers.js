'use strict';

const { NotFoundError } = require('restify');

module.exports = function (db) {
  return {
    getCollector: getCollector,
    getCollectors: getCollectors,
    getCollectorLogs: getCollectorLogs,
    getItem: getItem,
    getItems: getItems,
    getTypes: getTypes
  };

  function getData(result) {
    return result.toJSON();
  }

  function getCollector(req, res, next) {
    return db.collectors.findById(req.params.collectorId).then(result => {
      if (result) {
        res.send(getData(result));
      } else {
        res.send(new NotFoundError('Cannot find collector'));
      }
      next();
    });
  }

  function getCollectors(req, res, next) {
    return db.collectors.findAll().then(results => {
      res.send(results.map(getData));
      next();
    });
  }

  function getCollectorLogs(req, res, next) {
    return db.collectorLogs.findAll({
      where: {
        collector_id: req.params.collectorId // eslint-disable-line camelcase
      },
      order: [['timestamp', 'DESC']]
    }).then(results => {
      res.send(results.map(getData));
      next();
    });
  }

  function getItem(req, res, next) {
    return db.items.findOne({
      where: {
        id: req.params.itemId,
        type_id: req.params.typeId // eslint-disable-line camelcase
      }
    }).then(result => {
      if (result) {
        res.send(getData(result));
      } else {
        res.send(new NotFoundError('Cannot find item'));
      }
      next();
    });
  }

  function getItems(req, res, next) {
    let offset = Number(req.params.start) || 0;
    let limit = Number(req.params.limit) || 20;
    limit = Math.min(limit, 1000);
    return db.items.findAll({
      where: {
        type_id: req.params.typeId // eslint-disable-line camelcase
      },
      offset: offset,
      limit: limit,
      order: [['rank', 'DESC']]
    }).then(results => {
      res.send(results.map(getData));
      next();
    });
  }

  function getTypes(req, res, next) {
    return db.types.findAll().then(results => {
      res.send(results.map(getData));
      next();
    });
  }
};