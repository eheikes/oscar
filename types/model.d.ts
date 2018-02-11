interface OscarModelProperty {
  type: Function
  default?: any
  index?: boolean
  limit?: number
  null?: boolean
  unique?: boolean
}

interface OscarModelSchema {
  [name: string]: OscarModelProperty | Function
}

interface OscarModel {
}
