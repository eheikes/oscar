"use strict";
const config = require("config");
const database_1 = require("./database");
const getHandlers = require("./handlers");
const restify = require("restify");
let db = new database_1.Database(config.get('database'));
let { getCollector, getCollectors, getCollectorLogs, getItem, getItems, deleteItem, patchItem, getTypes, } = getHandlers(db);
let apiConfig = config.get('api');
let server = restify.createServer(apiConfig);
server.use(restify.bodyParser({ mapParams: false }));
server.get('/collectors', getCollectors);
server.get('/collectors/:collectorId', getCollector);
server.get('/collectors/:collectorId/logs', getCollectorLogs);
server.get('/types', getTypes);
server.get('/types/:typeId', getItems);
server.get('/types/:typeId/:itemId', getItem);
server.del('/types/:typeId/:itemId', deleteItem);
server.patch('/types/:typeId/:itemId', patchItem);
db.ready.then(() => {
    server.listen(apiConfig.port, apiConfig.hostname, () => {
        // tslint:disable-next-line no-console
        console.log('%s listening at %s', server.name, server.url);
    });
});
