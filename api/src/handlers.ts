import {
  BadRequestError,
  InternalError,
  NotFoundError,
  RequestHandler,
  Response
} from 'restify';
import { DestroyOptions, FindOptions, UpdateOptions } from 'sequelize';
import { Database } from './database';
import { CollectorAttributes, CollectorInstance } from './models/collector';
import { CollectorLogAttributes, CollectorLogInstance } from './models/collectorlog';
import { ItemAttributes, ItemInstance } from './models/item';
import { TypeAttributes, TypeInstance } from './models/type';

interface Collector {
  id: string;
  name: string;
  numErrors: number;
}

interface CollectorLog {
  id: number;
  timestamp: string;
  log: string;
  numErrors: number;
}

interface Item {
  id: number;
  added: string;
  deleted: string|null;
  url: string;
  title: string;
  author: string|null;
  summary: string|null;
  categories: string[];
  length: number|null;
  rating: number|null;
  due: string|null;
  rank: number;
  expectedRank: number|null;
}

export = (db: Database) => {
  let formatItem = (item: ItemAttributes): Item => {
    let formattedItem: Item = {
      id: item.id,
      url: item.url,
      title: item.title,
      author: item.author,
      summary: item.summary,
      length: item.length,
      rating: item.rating,
      due: item.due && item.due.toISOString(),
      rank: item.rank,
      expectedRank: item.expectedRank,
      categories: item.categories.length === 0 ?
        [] :
        item.categories.split(','),
      added: item.createdAt.toISOString(),
      deleted: item.deletedAt && item.deletedAt.toISOString(),
    };
    return formattedItem;
  };

  let deleteItem: RequestHandler = (req, res, next) => {
    let opts: FindOptions & DestroyOptions = {
      where: {
        id: req.params.itemId,
        type_id: req.params.typeId // eslint-disable-line camelcase
      }
    };
    return db.items.destroy(opts).then((result: number) => {
      if (result) {
        opts.paranoid = false; // include the deleted item
        return db.items.findOne(opts).then(newItem => {
          if (newItem) {
            res.send(formatItem(newItem.toJSON()));
          } else {
            res.send(new InternalError('Cannot find item that was deleted'));
          }
        });
      } else {
        res.send(new NotFoundError('Cannot find item'));
      }
    }).then(next).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let getCollector: RequestHandler = (req, res, next) => {
    // Ideally we could just use a subquery:
    // SELECT *,
    //   (SELECT num_errors as numErrors FROM collector_logs
    //   WHERE collector_logs.collector_id = 'facebook-feed'
    //   ORDER BY timestamp DESC LIMIT 1) AS numErrors
    // FROM collectors WHERE collectors.id = 'facebook-feed'
    // But sqlite doesn't support scalar subqueries, so use separate queries.
    return Promise.all([
      db.collectors.findById(req.params.collectorId),
      db.collectorLogs.findOne({
        where: {
          collector_id: req.params.collectorId // eslint-disable-line camelcase
        },
        order: [
          ['timestamp', 'DESC']
        ]
      })
    ]).then(([collectorResult, logResult]) => {
      if (collectorResult) {
        let data = collectorResult.toJSON();
        data.numErrors = (logResult && logResult.numErrors) || 0;
        res.send(data);
      } else {
        res.send(new NotFoundError('Cannot find collector'));
      }
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let getCollectors: RequestHandler = (req, res, next) => {
    return db.collectors.findAll({
      include: [{
        model: db.collectorLogs,
        as: 'Logs',
      }],
      order: [
        ['id', 'ASC'],
        [{ model: db.collectorLogs, as: 'Logs' }, 'timestamp', 'DESC']
      ]
    }).then(results => {
      let reformatted = results.map(item => item.toJSON()).map(item => {
        let formattedCollector: Collector = {
          id: item.id,
          name: item.name,
          numErrors: (item.Logs && item.Logs[0] && item.Logs[0].numErrors) || 0,
        };
        return formattedCollector;
      });
      res.send(reformatted);
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let getCollectorLogs: RequestHandler = (req, res, next) => {
    return db.collectorLogs.findAll({
      where: {
        collector_id: req.params.collectorId // eslint-disable-line camelcase
      },
      order: [
        ['timestamp', 'DESC']
      ]
    }).then(results => {
      let data = results.map(item => item.toJSON()).map(log => {
        let formattedLog: CollectorLog = {
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          log: log.log,
          numErrors: log.numErrors,
        };
        return formattedLog;
      });
      res.send(data);
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let getItem: RequestHandler = (req, res, next) => {
    return db.items.findOne({
      where: {
        id: req.params.itemId,
        type_id: req.params.typeId // eslint-disable-line camelcase
      }
    }).then(result => {
      if (result) {
        res.send(formatItem(result.toJSON()));
      } else {
        res.send(new NotFoundError('Cannot find item'));
      }
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let getItems: RequestHandler = (req, res, next) => {
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
      offset,
      limit,
      order: [
        ['rank', 'DESC']
      ]
    }).then(results => {
      let data = results.map(item => item.toJSON()).map(formatItem);
      res.send(data);
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let getTypes: RequestHandler = (req, res, next) => {
    return db.types.findAll().then(results => {
      res.send(results.map(item => item.toJSON()));
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  let patchItem: RequestHandler = (req, res, next) => {
    req.body = req.body || {};
    let opts: FindOptions & UpdateOptions = {
      where: {
        id: req.params.itemId,
        type_id: req.params.typeId // eslint-disable-line camelcase
      }
    };
    let keys = Object.keys(req.body);
    let allowedFields = ['expectedRank'];
    let notAllowed = (key: string) => { return !allowedFields.includes(key); };
    if (keys.length === 0 || keys.some(notAllowed)) {
      res.send(new BadRequestError(`The only patchable fields are ${allowedFields.join(', ')}`));
      next();
      return Promise.resolve();
    }
    return db.items.update(req.body, opts).then(result => {
      if (result[0]) {
        opts.paranoid = false; // allow deleted items
        return db.items.findOne(opts).then(item => {
          if (item) {
            res.send(formatItem(item.toJSON()));
          } else {
            res.send(new InternalError('Cannot find item that was updated'));
          }
        });
      } else {
        res.send(new NotFoundError('Cannot find item'));
      }
    }).then(next).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

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
};
