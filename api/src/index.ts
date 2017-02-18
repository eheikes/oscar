import * as config from 'config';
import { Database, DatabaseConfig } from './database';
import getHandlers = require('./handlers');
import restify = require('restify');

let db = new Database(config.get<DatabaseConfig>('database'));
let {
  getCollector,
  getCollectors,
  getCollectorLogs,
  getItem,
  getItems,
  deleteItem,
  patchItem,
  getTypes,
} = getHandlers(db);

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
