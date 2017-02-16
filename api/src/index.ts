import * as config from 'config';
import { Database, DatabaseConfig } from './database';
import getHandlers = require('./handlers');
import restify = require('restify');

let db = new Database(config.get<DatabaseConfig>('database'));
let handlers = getHandlers(db);

interface ApiConfig {
  name: string;
  protocol: string;
  hostname: string;
  port: number;
  pathname: string;
}
let apiConfig = config.get<ApiConfig>('api');

let server = restify.createServer(apiConfig);

server.use(restify.bodyParser({ mapParams: false }));

server.get('/collectors', handlers.getCollectors);
server.get('/collectors/:collectorId', handlers.getCollector);
server.get('/collectors/:collectorId/logs', handlers.getCollectorLogs);
server.get('/types', handlers.getTypes);
server.get('/types/:typeId', handlers.getItems);
server.get('/types/:typeId/:itemId', handlers.getItem);
server.del('/types/:typeId/:itemId', handlers.deleteItem);
server.patch('/types/:typeId/:itemId', handlers.patchItem);

db.ready.then(() => {
  server.listen(apiConfig.port, apiConfig.hostname, () => {
    // tslint:disable-next-line no-console
    console.log('%s listening at %s', server.name, server.url);
  });
});
