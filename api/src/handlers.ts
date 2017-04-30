/// <reference path="keyword-extractor.d.ts" />
/// <reference path="mnemonist.d.ts" />

import * as config from 'config';
import MultiSet = require('mnemonist/multi-set');
import {
  BadRequestError,
  InternalError,
  NotFoundError,
  RequestHandler,
  Response
} from 'restify';
import { DestroyOptions, FindOptions, UpdateOptions } from 'sequelize';
import { v4 as uuid } from 'uuid';
import { parse } from 'url';
import { extract } from 'keyword-extractor';

import { Database } from './database';
import { Collector, CollectorAttributes, CollectorInstance, toCollector } from './models/collector';
import { CollectorLog, CollectorLogAttributes, CollectorLogInstance, toCollectorLog } from './models/collectorlog';
import { Item, ItemAttributes, ItemInstance, toItem } from './models/item';
import { Type, TypeAttributes, TypeInstance } from './models/type';
import lmr from './lmr';

interface RankingConfig {
  numKeywords: number;
  numVars: number;
}

interface RankingData {
  authors: MultiSet;
  categories: MultiSet;
  hosts: MultiSet;
  keywords: MultiSet;
}

export = (db: Database) => {
  let rankingConfig = config.get<RankingConfig>('ranking');

  // Create ranking data for use when calculating coefficients.
  let collectRankingData = (items: ItemInstance[]): RankingData => {
    let data: RankingData = {
      authors: new MultiSet(),
      categories: new MultiSet(),
      hosts: new MultiSet(),
      keywords: new MultiSet(),
    };

    items.forEach(itemInstance => {
      let item = itemInstance.toJSON();

      // Add the author.
      if (item.author) {
        data.authors.add(item.author);
      }

      // Collect categories.
      item.categories.split(',').forEach(category => {
        if (category !== '') {
          data.categories.add(category);
        }
      });

      // Add the host.
      let host = parse(item.url).hostname;
      if (host) {
        data.hosts.add(host);
      }

      // Add the keywords.
      let extractOpts = {
        language: 'english',
        remove_digits: false,
        remove_duplicates: true,
        return_changed_case: true,
      };
      let summaryKeywords = extract(item.summary|| '', extractOpts);
      let titleKeywords = extract(item.title, extractOpts);
      [...summaryKeywords, ...titleKeywords].forEach((keyword: string) => {
        data.keywords.add(keyword);
      });
    });

    return data;
  };

  // Calculates the MLR vector for the given item.
  let calculateVector = (itemInstance: ItemInstance, totals: RankingData): number[] => {
    const now = Date.now();
    let item = itemInstance.toJSON();
    let vector: number[] = [];

    // Add each author.
    for (let author of totals.authors) {
      vector.push(Number(item.author === author));
    }

    // Add each category.
    let categories = item.categories.split(',');
    for (let category of totals.categories) {
      vector.push(Number(categories.includes(category)));
    }

    // Add each URL host.
    for (let host of totals.hosts) {
      let thisHost = parse(item.url).hostname;
      vector.push(Number(thisHost === host));
    }

    // Add as many keywords as possible.
    let keywords = new Set(totals.keywords); // use Set to remove duplicates
    [...keywords].slice(0, rankingConfig.numKeywords).forEach(keyword => {
      let regexp = new RegExp(keyword, 'gi');
      let titleMatches = item.title.match(regexp);
      let summaryMatches = item.summary ?
        item.summary.match(regexp) :
        [];
      let count = (
        (titleMatches ? titleMatches.length : 0) +
        (summaryMatches ? summaryMatches.length : 0)
      );
      vector.push(count);
    });

    // Add the time since it was added, and the time until due.
    vector.push((now - item.createdAt.getTime()) / 1000); // in secs
    vector.push(item.deletedAt === null ?
      Number.MAX_SAFE_INTEGER : // use a large number
      (item.deletedAt.getTime() - now) / 1000 // in secs
    );

    // Add the length and rating.
    // Use -1 for null values, to distinguish from 0 values.
    vector.push(Number(item.length === null ? -1 : item.length));
    vector.push(Number(item.rating === null ? -1 : item.rating));

    return vector;
  };

  // Calculates the MLR coefficients for the given items.
  let calculateCoefficients = (items: ItemInstance[]) => {
    let totals = collectRankingData(items);
    console.log('totals:', totals);
    let data = items.map(item => calculateVector(item, totals));
    console.log('data:', data);
    let expected = items.map(item => {
      return [item.toJSON().expectedRank as number];
    });
    return lmr.calculateCoefficients(data, expected);
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
            res.send(toItem(newItem.toJSON()));
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
      let reformatted = results.map(item => item.toJSON()).map(toCollector);
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
      let data = results.map(item => item.toJSON()).map(toCollectorLog);
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
        res.send(toItem(result.toJSON()));
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
      let data = results.map(item => item.toJSON()).map(toItem);
      res.send(data);
      next();
    }).catch(err => {
      res.send(new InternalError(err.message));
    });
  };

  // Get the latest items that have been ranked by the user.
  let getRankedItems = (typeId: string) => {
    // Get items that have expectedRank set, but not deletedAt, sorted by updatedAt
    //   (because expectedRank is the only thing that can change).
    return db.items.findAll({
      where: {
        expectedRank: {
          $ne: null,
        },
        deletedAt: null,
        type_id: typeId,
      },
      limit: rankingConfig.numVars,
      order: [
        ['updatedAt', 'DESC']
      ]
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
            res.send(toItem(item.toJSON()));
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

  let rankItems: RequestHandler = (req, res, next) => {
    return db.types.findAll().then(results => {
      return Promise.all(results.map(type => {
        let typeId = type.toJSON().id;
        return getRankedItems(typeId).then(items => {
          // At least 2 items are needed to for calculating coefficients.
          if (items.length < 2) { return null; }
          return calculateCoefficients(items);
        }).then(coeffs => {
          if (!coeffs) { return; }
          // TODO save coeffs to DB
          // TODO recalculate all items
        });
      }));
    }).then(() => {
      res.send({
        taskId: uuid(),
        status: 'success',
      });
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
    patchItem,
    rankItems,
  };
};
