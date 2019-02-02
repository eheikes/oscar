import { Request, Response } from 'express'
import { createFakeRequest, createFakeResponse } from '../../helpers/request-response'
import { getItem, getItems } from '../../../src/controllers/item'

describe('getItem()', () => {
  let req: Request
  let res: Response

  beforeEach(() => {
    req = createFakeRequest()
    res = createFakeResponse()
  })

  it('should send {}', async () => {
    await getItem(req, res)
    expect(res.send).toHaveBeenCalledWith({})
  })
})

describe('getItems()', async () => {
  let req: Request
  let res: Response

  beforeEach(() => {
    req = createFakeRequest()
    res = createFakeResponse()
  })

  it('should send {}', async () => {
    await getItems(req, res)
    expect(res.send).toHaveBeenCalledWith({})
  })
})
