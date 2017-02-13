"use strict";
const restify_1 = require("restify");
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
    function formatItem(item) {
        item.added = item.createdAt.toISOString();
        item.categories = item.categories.length === 0 ?
            [] :
            item.categories.split(',');
        item.deleted = item.deletedAt && item.deletedAt.toISOString();
        item.due = item.due && item.due.toISOString();
        delete item.createdAt;
        delete item.deletedAt;
        delete item.type_id;
        delete item.updatedAt;
        return item;
    }
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
                    res.send(formatItem(getData(newItem)));
                });
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find item'));
            }
        }).then(next);
    }
    function getCollector(req, res, next) {
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
        });
    }
    function getCollectors(req, res, next) {
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
            let reformatted = results.map(getData).map(item => {
                item.numErrors = (item.Logs[0] && item.Logs[0].numErrors) || 0;
                delete item.Logs;
                return item;
            });
            res.send(reformatted);
            next();
        });
    }
    function getCollectorLogs(req, res, next) {
        return db.collectorLogs.findAll({
            where: {
                collector_id: req.params.collectorId // eslint-disable-line camelcase
            },
            order: [
                ['timestamp', 'DESC']
            ]
        }).then(results => {
            let data = results.map(getData).map(log => {
                log.timestamp = log.timestamp.toISOString();
                delete log.collector_id;
                return log;
            });
            res.send(data);
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
                res.send(formatItem(getData(result)));
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find item'));
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
            order: [
                ['rank', 'DESC']
            ]
        }).then(results => {
            let data = results.map(getData).map(formatItem);
            res.send(data);
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
        let notAllowed = key => { return !allowedFields.includes(key); };
        if (keys.length === 0 || keys.some(notAllowed)) {
            res.send(new restify_1.BadRequestError(`The only patchable fields are ${allowedFields.join(', ')}`));
            next();
            return Promise.resolve();
        }
        return db.items.update(req.body, opts).then(result => {
            if (result[0]) {
                opts.paranoid = false; // allow deleted items
                return db.items.findOne(opts).then(item => {
                    res.send(formatItem(getData(item)));
                });
            }
            else {
                res.send(new restify_1.NotFoundError('Cannot find item'));
            }
        }).then(next);
    }
};
