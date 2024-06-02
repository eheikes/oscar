import esmock from 'esmock'
import { Response } from 'express'

describe('controllers', () => {
  let req: any
  let resSpy: jasmine.SpyObj<Response>

  beforeEach(() => {
    req = {}
    resSpy = jasmine.createSpyObj('response', ['json', 'send', 'status'])
  })

  describe('getItemsController', () => {
    it('should retrieve the items based on the query', async () => {
      const getItemsSpy = jasmine.createSpy('getItems')
      const { getItemsController } = await esmock('../../src/controllers.js', {
        '../../src/items.js': {
          getItems: getItemsSpy
        }
      })
      req.query = { foo: 1, bar: 2 }
      await getItemsController(req, resSpy)
      expect(getItemsSpy).toHaveBeenCalledWith(req.query)
    })

    it('should respond with the items as JSON', async () => {
      const items = [{ id: 1 }, { id: 2 }]
      const getItemsSpy = jasmine.createSpy('getItems').and.resolveTo(items)
      const { getItemsController } = await esmock('../../src/controllers.js', {
        '../../src/items.js': {
          getItems: getItemsSpy
        }
      })
      await getItemsController(req, resSpy)
      expect(resSpy.json).toHaveBeenCalledWith(items)
    })
  })
})
