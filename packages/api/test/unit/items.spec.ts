import esmock from 'esmock'
import { setEnvVars } from '../helpers/env.js'
import { ClientError } from '../../src/error.js'

describe('items', () => {
  let getDatabaseConnectionSpy: jasmine.Spy
  let fromSpy: jasmine.Spy
  let whereSpy: jasmine.Spy
  let whereILikeSpy: jasmine.Spy
  let whereNullSpy: jasmine.Spy
  let andWhereSpy: jasmine.Spy
  let orWhereSpy: jasmine.Spy
  let orderBySpy: jasmine.Spy
  let orderByRawSpy: jasmine.Spy
  let offsetSpy: jasmine.Spy
  let limitSpy: jasmine.Spy
  let mockResult: any

  beforeEach(() => {
    setEnvVars()
    mockResult = [{
      author: null,
      created_at: new Date(),
      deleted_at: null,
      due: new Date(),
      expected_rank: null,
      id: '23530f2c-9838-4ba5-8fe6-d031609ba328',
      image_uri: null,
      language: null,
      length: null,
      rank: null,
      rating: null,
      summary: null,
      title: 'Test Item',
      type_id: 'read',
      updated_at: new Date(),
      uri: 'http://example.com'
    }]
    const mockKnex: any = Promise.resolve(mockResult)
    fromSpy = jasmine.createSpy('from').and.returnValue(mockKnex)
    whereSpy = jasmine.createSpy('where').and.returnValue(mockKnex)
    whereILikeSpy = jasmine.createSpy('whereILike').and.returnValue(mockKnex)
    whereNullSpy = jasmine.createSpy('whereNull').and.returnValue(mockKnex)
    andWhereSpy = jasmine.createSpy('andWhere').and.callFake((func: Function) => {
      func(mockKnex)
      return mockKnex
    })
    orWhereSpy = jasmine.createSpy('orWhere').and.returnValue(mockKnex)
    orderBySpy = jasmine.createSpy('orderBy').and.returnValue(mockKnex)
    orderByRawSpy = jasmine.createSpy('orderByRaw').and.returnValue(mockKnex)
    offsetSpy = jasmine.createSpy('offset').and.returnValue(mockKnex)
    limitSpy = jasmine.createSpy('limit').and.returnValue(mockKnex)
    mockKnex.select = () => mockKnex
    mockKnex.from = fromSpy
    mockKnex.andWhere = andWhereSpy
    mockKnex.where = whereSpy
    mockKnex.whereILike = whereILikeSpy
    mockKnex.whereNull = whereNullSpy
    mockKnex.orWhere = orWhereSpy
    mockKnex.orderBy = orderBySpy
    mockKnex.orderByRaw = orderByRawSpy
    mockKnex.offset = offsetSpy
    mockKnex.limit = limitSpy
    getDatabaseConnectionSpy = jasmine.createSpy('getDatabaseConnection').and.returnValue(mockKnex)
  })

  describe('getItems()', () => {
    it('should query the items from the database', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({})
      expect(fromSpy).toHaveBeenCalledWith('items')
    })

    it('should return the items', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      const items = await getItems({})
      expect(items).toEqual([{
        author: null,
        createdAt: jasmine.any(Date),
        deletedAt: null,
        due: jasmine.any(Date),
        expectedRank: null,
        id: '23530f2c-9838-4ba5-8fe6-d031609ba328',
        imageUri: null,
        language: null,
        length: null,
        rank: null,
        rating: null,
        summary: null,
        title: 'Test Item',
        type: 'read',
        updatedAt: jasmine.any(Date),
        uri: 'http://example.com'
      }])
    })

    it('should default to excluding deleted items', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({})
      expect(whereNullSpy).toHaveBeenCalledWith('deleted_at')
    })

    it('should restrict rank when "maximumRank" is set', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ maximumRank: '7' })
      expect(whereSpy).toHaveBeenCalledWith('rank', '<=', 7)
    })

    it('should restrict rank when "minimumRank" is set', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ minimumRank: '7' })
      expect(whereSpy).toHaveBeenCalledWith('rank', '>=', 7)
    })

    it('should restrict created_at when "since" is set', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ since: '2024-05-28T05:35:07.223Z' })
      expect(whereSpy).toHaveBeenCalledWith('created_at', '>=', '2024-05-28T05:35:07.223Z')
    })

    it('should search for types when "type" is set (string)', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ type: 'read' })
      expect(andWhereSpy).toHaveBeenCalled()
      expect(orWhereSpy).toHaveBeenCalledWith('type_id', 'read')
    })

    it('should search for types when "type" is set (array)', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ type: ['read', 'watch'] })
      expect(andWhereSpy).toHaveBeenCalled()
      expect(orWhereSpy).toHaveBeenCalledWith('type_id', 'read')
      expect(orWhereSpy).toHaveBeenCalledWith('type_id', 'watch')
    })

    it('should search for text when "search" is set', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ search: 'foo bar baz' })
      expect(whereILikeSpy).toHaveBeenCalledWith('title', '%foo%')
      expect(whereILikeSpy).toHaveBeenCalledWith('title', '%bar%')
      expect(whereILikeSpy).toHaveBeenCalledWith('title', '%baz%')
    })

    it('should sort using the "orderBy" and "orderDir" params', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ orderBy: 'type', orderDir: 'asc' })
      expect(orderBySpy).toHaveBeenCalledWith('type_id', 'asc')
    })

    it('should default to sorting by creation date', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({})
      expect(orderBySpy).toHaveBeenCalledWith('created_at', 'desc')
    })

    it('should randomly sort when "orderBy" is "random"', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ orderBy: 'random' })
      expect(orderByRawSpy).toHaveBeenCalledWith('random()')
    })

    it('should throw an error if "orderBy" param is invalid', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await expectAsync(getItems({ orderBy: 'foobar' })).toBeRejectedWithError(ClientError)
    })

    it('should set offset when "offset" is set', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ offset: '7' })
      expect(offsetSpy).toHaveBeenCalledWith(7)
    })

    it('should set limit when "count" is set', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ count: '7' })
      expect(limitSpy).toHaveBeenCalledWith(7)
    })

    it('should set a default limit', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({})
      expect(limitSpy).toHaveBeenCalledWith(jasmine.any(Number))
    })

    it('should set a maximum limit', async () => {
      const { getItems } = await esmock('../../src/items.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getItems({ count: '9999999' })
      expect(limitSpy).toHaveBeenCalledWith(100)
    })
  })
})
