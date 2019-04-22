import * as request from 'supertest'
import app from '../../src/app'
import { DatabaseConnection, getDatabaseConnection } from '../../src/lib/database'
import { createTable, insertData } from '../helpers/database'

const data = require('../fixtures/types.json')

describe('/types', () => {
  let db: DatabaseConnection

  beforeAll(async () => {
    db = getDatabaseConnection()
    await createTable(db, 'types.sql')
    await insertData(db, 'types', data)
  })

  describe('GET', () => {
    it('should return an array of all the types', () => {
      return request(app)
        .get('/types')
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .expect(data)
    })
  })
})
