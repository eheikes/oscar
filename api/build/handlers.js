"use strict";
const restify_1 = require("restify");
const collector_1 = require("./models/collector");
const collectorlog_1 = require("./models/collectorlog");
const item_1 = require("./models/item");
module.exports = (db) => {
    let deleteItem = (req, res, next) => {
        let opts = {
            where: {
                id: req.params.itemId,
                type_id: req.params.typeId // eslint-disable-line camelcase
            }
        };
        return db.items.destroy(opts).then((result) => {
            if (result) {
                opts.paranoid = false; // include the deleted item
                return db.items.findOne(opts).then(newItem => {
                    if (newItem) {
                        res.send(item_1.toItem(newItem.toJSON()));
                    }
                    else {
                        res.send(new restify_1.InternalError('Cannot find item that was deleted'));
                    }
                });
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find item'));
            }
        }).then(next).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let getCollector = (req, res, next) => {
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
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find collector'));
            }
            next();
        }).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let getCollectors = (req, res, next) => {
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
            let reformatted = results.map(item => item.toJSON()).map(collector_1.toCollector);
            res.send(reformatted);
            next();
        }).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let getCollectorLogs = (req, res, next) => {
        return db.collectorLogs.findAll({
            where: {
                collector_id: req.params.collectorId // eslint-disable-line camelcase
            },
            order: [
                ['timestamp', 'DESC']
            ]
        }).then(results => {
            let data = results.map(item => item.toJSON()).map(collectorlog_1.toCollectorLog);
            res.send(data);
            next();
        }).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let getItem = (req, res, next) => {
        return db.items.findOne({
            where: {
                id: req.params.itemId,
                type_id: req.params.typeId // eslint-disable-line camelcase
            }
        }).then(result => {
            if (result) {
                res.send(item_1.toItem(result.toJSON()));
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find item'));
            }
            next();
        }).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let getItems = (req, res, next) => {
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
            let data = results.map(item => item.toJSON()).map(item_1.toItem);
            res.send(data);
            next();
        }).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let getTypes = (req, res, next) => {
        return db.types.findAll().then(results => {
            res.send(results.map(item => item.toJSON()));
            next();
        }).catch(err => {
            res.send(new restify_1.InternalError(err.message));
        });
    };
    let patchItem = (req, res, next) => {
        req.body = req.body || {};
        let opts = {
            where: {
                id: req.params.itemId,
                type_id: req.params.typeId // eslint-disable-line camelcase
            }
        };
        let keys = Object.keys(req.body);
        let allowedFields = ['expectedRank'];
        let notAllowed = (key) => { return !allowedFields.includes(key); };
        if (keys.length === 0 || keys.some(notAllowed)) {
            res.send(new restify_1.BadRequestError(`The only patchable fields are ${allowedFields.join(', ')}`));
            next();
            return Promise.resolve();
        }
        return db.items.update(req.body, opts).then(result => {
            if (result[0]) {
                opts.paranoid = false; // allow deleted items
                return db.items.findOne(opts).then(item => {
                    if (item) {
                        res.send(item_1.toItem(item.toJSON()));
                    }
                    else {
                        res.send(new restify_1.InternalError('Cannot find item that was updated'));
                    }
                });
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find item'));
            }
        }).then(next).catch(err => {
            res.send(new restify_1.InternalError(err.message));
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
