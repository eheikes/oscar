import * as proxyquire from 'proxyquire'
import {
  DatabaseConnection,
  getDatabaseConnection,
  setDatabaseConnection
} from '../../../src/lib/database'

describe('database routines', () => {
  let knexSpy: jasmine.Spy

  beforeEach(() => {
    knexSpy = jasmine.createSpy('Knex')
  })

  describe('DatabaseConnection', () => {
    let DBConnection: any

    beforeEach(() => {
      DBConnection = proxyquire('../../../src/lib/database', {
        knex: knexSpy
      }).DatabaseConnection
    })

    it('should setup a connection to the Postgres DB', () => {
      new DBConnection({})
      expect(knexSpy).toHaveBeenCalled()
    })

    it('should use the passed options to configure the connection', () => {
      new DBConnection({
        database: 'test',
        host: 'example.com',
        user: 'username',
        password: 'password'
      })
      const args = knexSpy.calls.mostRecent().args[0]
      expect(args.connection.database).toBe('test')
      expect(args.connection.host).toBe('example.com')
      expect(args.connection.user).toBe('username')
      expect(args.connection.password).toBe('password')
    })
  })

  describe('getDatabaseConnection()', () => {
    it('should throw an error if setDatabaseConnection() is not called first', () => {
      expect(() => {
        getDatabaseConnection()
      }).toThrowError(/Database not established/)
    })

    it('should return a DB connection', () => {
      setDatabaseConnection({})
      expect(getDatabaseConnection()).toEqual(jasmine.any(DatabaseConnection))
    })
  })

  describe('setDatabaseConnection()', () => {
    let setConn: any

    beforeEach(() => {
      setConn = proxyquire('../../../src/lib/database', {
        knex: knexSpy
      }).setDatabaseConnection
    })

    it('should use the given env values', () => {
      setConn({
        DATABASE_HOST: 'test_host',
        DATABASE_NAME: 'test_name',
        DATABASE_PASSWORD: 'test_password',
        DATABASE_USER: 'test_user',
      })
      const args = knexSpy.calls.mostRecent().args[0]
      expect(args.connection.database).toBe('test_name')
      expect(args.connection.host).toBe('test_host')
      expect(args.connection.user).toBe('test_user')
      expect(args.connection.password).toBe('test_password')
    })

    it('should succeed with no env values', () => {
      expect(() => {
        setDatabaseConnection({})
      }).not.toThrow()
    })

    it('should return a DB connection', () => {
      expect(setDatabaseConnection({})).toEqual(jasmine.any(DatabaseConnection))
    })
  })
})
