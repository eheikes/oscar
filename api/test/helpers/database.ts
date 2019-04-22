import { readFileSync } from 'fs'
import { join } from 'path'
import { DatabaseConnection } from '../../src/lib/database'

const databaseDir = join(__dirname, '..', '..', '..', 'database')

export const createFakeDatabase = (): jasmine.SpyObj<DatabaseConnection> => {
  return jasmine.createSpyObj<DatabaseConnection>('database', [
    'query'
  ])
}

/**
 * Creates a DB table using the given schema SQL file in the "database" directory.
 */
export const createTable = async (db: DatabaseConnection, schemaFile: string) => {
  const schema = readFileSync(join(databaseDir, schemaFile), 'utf8')
  await db.query(schema)
}

/**
 * Inserts the given array of data into a DB table.
 */
export const insertData = async (
  db: DatabaseConnection,
  table: string,
  data: {[key: string]: any}[]
) => {
  if (data.length === 0) { return }
  const columns = Object.keys(data[0])
  let sql = `
    INSERT INTO ${table}
    ("${columns.join('","')}")
    VALUES
  `
  let bindings: any[] = []
  data.forEach((obj, i) => {
    if (i !== 0) { sql += ',' }
    sql += `(${'?'.repeat(columns.length).split('').join(',')})`
    bindings = bindings.concat(columns.map(prop => obj[prop]))
  })
  await db.query(sql, bindings)
}
