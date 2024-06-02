import esmock from 'esmock'
import { Config } from '../../src/config.js'

describe('database', () => {
  let knexSpy: jasmine.Spy
  let config: Config = {
    DB_HOST: 'localhost',
    DB_NAME: 'test',
    DB_PORT: 5432,
    DB_USER: 'username',
    DB_PASSWORD: 'password',
    DB_SSL: false
  }
  const mockConnection = { foo: 1 }

  beforeEach(() => {
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
        knex: knexSpy,
        '../../src/config.js': {
          getConfig: () => config
        }
      })
      getDatabaseConnection()
      expect(knexSpy).toHaveBeenCalled()
      const arg = knexSpy.calls.mostRecent().args[0]
      expect(arg.client).toBe('pg')
      expect(arg.connection.host).toBe(config.DB_HOST)
      expect(arg.connection.user).toBe(config.DB_USER)
      expect(arg.connection.database).toBe(config.DB_NAME)
      expect(arg.connection.ssl).toBe(config.DB_SSL)
    })

    it('should pull in the RDS CA cert when SSL is enabled', async () => {
      const config: Config = {
        DB_HOST: 'localhost',
        DB_NAME: 'test',
        DB_PORT: 5432,
        DB_USER: 'username',
        DB_PASSWORD: 'password',
        DB_SSL: true
      }
      const { getDatabaseConnection } = await esmock('../../src/database.js', {
        knex: knexSpy,
        '../../src/config.js': {
          getConfig: () => config
        }
      })
      getDatabaseConnection()
      const arg = knexSpy.calls.mostRecent().args[0]
      expect(arg.connection.ssl.ca).toMatch('-----BEGIN CERTIFICATE-----')
    })

    it('should allow SSL to be disabled', async () => {
      const { getDatabaseConnection } = await esmock('../../src/database.js', {
        knex: knexSpy,
        '../../src/config.js': {
          getConfig: () => config
        }
      })
      getDatabaseConnection()
      const arg = knexSpy.calls.mostRecent().args[0]
      expect(arg.connection.ssl).toBe(false)
    })
  })
})
