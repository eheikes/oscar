'use strict';

const { BadRequestError, NotFoundError } = require('restify');

module.exports = function (db) {
  return {
    deleteItem,
    getCollector,
    getCollectors,
    getCollectorLogs,
    getItem,
    getItems,
    getTypes,
    patchItem
  };

  function getData(result) {
    return result.toJSON();
  }

  function deleteItem(req, res, next) {
    let opts = {
      where: {
        id: req.params.itemId,
        type_id: req.params.typeId // eslint-disable-line camelcase
      }
    };
    return db.items.destroy(opts).then(result => {
      if (result) {
        opts.paranoid = false; // include the deleted item
        return db.items.findOne(opts).then(newItem => {
          res.send(getData(newItem));
        });
      } else {
        res.send(new NotFoundError('Cannot find item'));
      }
    }).then(next);
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
    const defaultOffset = 0;
    const defaultLimit = 20;
    const maxNumItems = 1000;
    let offset = Number(req.params.start) || defaultOffset;
    let limit = Number(req.params.limit) || defaultLimit;
    limit = Math.min(limit, maxNumItems);
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

  function patchItem(req, res, next) {
    req.body = req.body || {};
    let opts = {
      where: {
        id: req.params.itemId,
        type_id: req.params.typeId // eslint-disable-line camelcase
      }
    };
    let keys = Object.keys(req.body);
    let allowedFields = ['expectedRank'];
    let notAllowed = key => {
      return !allowedFields.includes(key);
    };
    if (keys.length === 0 || keys.some(notAllowed)) {
      res.send(new BadRequestError(`The only patchable fields are ${ allowedFields.join(', ') }`));
      next();
      return Promise.resolve();
    }
    return db.items.update(req.body, opts).then(result => {
      if (result[0]) {
        opts.paranoid = false; // allow deleted items
        return db.items.findOne(opts).then(item => {
          res.send(getData(item));
        });
      } else {
        res.send(new NotFoundError('Cannot find item'));
      }
    }).then(next);
  }
};