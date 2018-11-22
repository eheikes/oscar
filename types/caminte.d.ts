declare module 'caminte' {
  export interface Config {
    driver: string
    host?: string
    port?: string
    username?: string
    password?: string
    database?: string
    pool?: boolean
    ssl?: boolean
  }

  export interface Property {
    type: Function
    default?: any
    index?: boolean
    limit?: number
    null?: boolean
    unique?: boolean
  }
  export interface Properties {
    [name: string]: Property | Function
  }

  interface WhereOptions {
    [field: string]: string | number
  }

  interface FindOptions {
    limit?: number
    offset?: number
    order?: 'asc' | 'desc'
    orderBy?: string
    where?: WhereOptions
  }

  export interface Instance {
    [property: string]: any
  }

  export class Schema {
    constructor(driver: string, config: Config)
    define(className: string, properties: Properties): Model
  }

  export class Model {
    find(opts: FindOptions): Instance[]
  }
}
