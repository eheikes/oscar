interface OscarModelProperty {
  type: Function
  autoIncrement?: boolean
  default?: any
  index?: boolean
  integer?: boolean
  limit?: number
  null?: boolean
  unique?: boolean
}

interface OscarModelSchema {
  [name: string]: OscarModelProperty | Function
}

interface OscarModel {
}
