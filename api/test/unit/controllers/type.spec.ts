import { Request, Response } from 'express'
import * as proxyquire from 'proxyquire'
import { DatabaseConnection } from '../../../src/lib/database'
import { createFakeDatabase } from '../../helpers/database'
import { createFakeRequest, createFakeResponse } from '../../helpers/request-response'

const fakeData = require('../../fixtures/types.json')

describe('getTypes()', async () => {
  let getTypes: Function
  let db: jasmine.SpyObj<DatabaseConnection>
  let req: Request
  let res: Response

  beforeEach(() => {
    db = createFakeDatabase()
    db.query.and.returnValue(fakeData)
    getTypes = proxyquire('../../../src/controllers/type', {
      '../lib/database': {
        getDatabaseConnection: () => db
      }
    }).getTypes
    req = createFakeRequest()
    res = createFakeResponse()
  })

  it('should return a JSON array of all rows from "types"', async () => {
    await getTypes(req, res)
    expect(res.json).toHaveBeenCalledWith(fakeData)
  })

  it('should send a 500 status if an error occurs', async () => {
    db.query.and.returnValue(Promise.reject(new Error('test error')))
    await getTypes(req, res)
    expect(res.sendStatus).toHaveBeenCalledWith(500)
  })
})
