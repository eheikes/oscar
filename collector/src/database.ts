//
// DB abstraction
//
import * as caminte from 'caminte'
import { SourceModel } from './models/source-model'
import { SourceLogModel } from './models/source-log-model'
import { ItemModel } from './models/item-model'
import { TypeModel } from './models/type-model'

let db: caminte.Schema | undefined

export let sourceLogs: SourceLogModel = new SourceLogModel()
export let sources: SourceModel = new SourceModel()
export let items: ItemModel = new ItemModel()
export let types: TypeModel = new TypeModel()

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
  sourceLogs = new SourceLogModel(db)
  sources = new SourceModel(db)
  items = new ItemModel(db)
  types = new TypeModel(db)
}
