//
// DB abstraction
//
import * as caminte from 'caminte'
import { CollectorModel } from './models/collector-model';
import { CollectorLogModel } from './models/collector-log-model';
import { ItemModel } from './models/item-model';
import { TypeModel } from './models/type-model'

let db: caminte.Schema | undefined

export let collectorLogs: CollectorLogModel | undefined
export let collectors: CollectorModel | undefined
export let items: ItemModel | undefined
export let types: TypeModel | undefined

const convertConfig = (config: OscarDatabaseConfig): caminte.Config => {
  return {
    driver: config.type,
    host: config.host,
    port: config.port || config.socket ?
      String(config.port || config.socket) :
      undefined,
    username: config.user,
    password: config.password,
    database: config.name || config.filename,
    pool: config.pool,
    ssl: config.ssl
  }
}

export const init = (config: OscarDatabaseConfig) => {
  const convertedConfig = convertConfig(config)
  db = new caminte.Schema(convertedConfig.driver, convertedConfig)
  collectorLogs = new CollectorLogModel(db)
  collectors = new CollectorModel(db)
  items = new ItemModel(db)
  types = new TypeModel(db)
}
