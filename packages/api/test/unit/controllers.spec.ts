import esmock from 'esmock'
import { Response } from 'express'

describe('controllers', () => {
  let req: any
  let resSpy: jasmine.SpyObj<Response>

  beforeEach(() => {
    req = {}
    resSpy = jasmine.createSpyObj('response', ['json', 'send', 'set', 'status'])
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

  describe('getProfileController', () => {
    it('should return the logged-in user info', async () => {
      const user = { foo: 1 }
      const { getProfileController } = await esmock('../../src/controllers.js')
      req = { oidc: { user } }
      await getProfileController(req, resSpy)
      expect(resSpy.json).toHaveBeenCalledWith(user)
    })
  })

  describe('getWebpageController', () => {
    it('should set an HTML content-type', async () => {
      const user = { foo: 1 }
      const { getWebpageController } = await esmock('../../src/controllers.js')
      req = {
        oidc: {
          isAuthenticated: () => true,
          user
        }
      }
      await getWebpageController(req, resSpy)
      expect(resSpy.set).toHaveBeenCalledWith('content-type', 'text/html')
    })

    it('should send the HTML', async () => {
      const user = { foo: 1 }
      const { getWebpageController } = await esmock('../../src/controllers.js')
      req = {
        oidc: {
          isAuthenticated: () => true,
          user
        }
      }
      await getWebpageController(req, resSpy)
      expect(resSpy.send.calls.mostRecent().args[0]).toContain('<h1>OSCAR</h1>')
    })
  })
})
