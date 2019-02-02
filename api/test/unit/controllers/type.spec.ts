import { Request, Response } from 'express'
import { createFakeRequest, createFakeResponse } from '../../helpers/request-response'
import { getTypes } from '../../../src/controllers/type'

describe('getTypes()', async () => {
  let req: Request
  let res: Response

  beforeEach(() => {
    req = createFakeRequest()
    res = createFakeResponse()
  })

  it('should send {}', async () => {
    await getTypes(req, res)
    expect(res.send).toHaveBeenCalledWith({})
  })
})
