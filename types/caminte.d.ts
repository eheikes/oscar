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
  export class Schema {
    constructor(driver: string, config: Config)
    define(className: string, properties: Properties): Model
  }
  export class Model {

  }
}
