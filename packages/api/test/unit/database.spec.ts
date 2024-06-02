import esmock from 'esmock'
import { setEnvVars } from '../helpers/env.js'

describe('database', () => {
  let knexSpy: jasmine.Spy
  const mockConnection = { foo: 1 }

  beforeEach(() => {
    setEnvVars()
    knexSpy = jasmine.createSpy('knex').and.returnValue(mockConnection)
  })

  describe('getDatabaseConnection()', () => {
    it('should create a DB connection', async () => {
      const { getDatabaseConnection } = await esmock('../../src/database.js', {
        knex: knexSpy
      })
      const db = getDatabaseConnection()
      expect(db).toBe(mockConnection)
    })

    it('should use the env vars for the config', async () => {
      const { getDatabaseConnection } = await esmock('../../src/database.js', {
        knex: knexSpy
      })
      getDatabaseConnection()
      expect(knexSpy).toHaveBeenCalled()
      const arg = knexSpy.calls.mostRecent().args[0]
      expect(arg.client).toBe('pg')
      expect(arg.connection.host).toBe(process.env.DB_HOST)
      expect(arg.connection.user).toBe(process.env.DB_USER)
      expect(arg.connection.database).toBe(process.env.DB_NAME)
      expect(arg.connection.ssl.rejectUnauthorized).toBe(true)
    })

    it('should pull in the RDS CA cert', async () => {
      const { getDatabaseConnection } = await esmock('../../src/database.js', {
        knex: knexSpy
      })
      getDatabaseConnection()
      const arg = knexSpy.calls.mostRecent().args[0]
      expect(arg.connection.ssl.ca).toMatch('-----BEGIN CERTIFICATE-----')
    })
  })
})
