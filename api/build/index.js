'use strict';

const config = require('config');
const Database = require('./database');
const getHandlers = require('./handlers');
const restify = require('restify');

let db = new Database(config.get('database'));
let handlers = getHandlers(db);

let apiConfig = config.get('api');
let server = restify.createServer(apiConfig);
server.get('/collectors', handlers.getCollectors);
server.get('/collectors/:collectorId', handlers.getCollector);
server.get('/collectors/:collectorId/logs', handlers.getCollectorLogs);
server.get('/types', handlers.getTypes);
server.get('/types/:typeId', handlers.getItems);
server.get('/types/:typeId/:itemId', handlers.getItem);
server.del('/types/:typeId/:itemId', handlers.deleteItem);

db.ready.then(() => {
  server.listen(apiConfig.port, apiConfig.hostname, function () {
    /* eslint-disable no-console */
    console.log('%s listening at %s', server.name, server.url);
    /* eslint-enable no-console */
  });
});