import esmock from 'esmock'

describe('users', () => {
  let getDatabaseConnectionSpy: jasmine.Spy
  let fromSpy: jasmine.Spy
  let mockResult: any
  let mockKnex: any

  beforeEach(() => {
    mockResult = [{
      created_at: '2024-06-14T06:26:57.549Z',
      deleted_at: null,
      email: null,
      id: '23530f2c-9838-4ba5-8fe6-d031609ba328',
      name: 'John Doe',
      nickname: 'jdoe',
      updated_at: '2024-06-14T06:26:57.549Z'
    }]
    mockKnex = Promise.resolve(mockResult)
    fromSpy = jasmine.createSpy('from').and.returnValue(mockKnex)
    mockKnex.select = () => mockKnex
    mockKnex.from = fromSpy
    mockKnex.where = () => mockKnex
    getDatabaseConnectionSpy = jasmine.createSpy('getDatabaseConnection').and.returnValue(mockKnex)
  })

  describe('getUserById()', () => {
    it('should return null if an ID is not passed', async () => {
      const { getUserById } = await esmock('../../src/users.js')
      const result = await getUserById()
      expect(result).toBe(null)
    })

    it('should query the user from the database', async () => {
      const { getUserById } = await esmock('../../src/users.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      await getUserById('abcde')
      expect(fromSpy).toHaveBeenCalledWith('users')
    })

    it('should return the user info', async () => {
      const { getUserById } = await esmock('../../src/users.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      const user = await getUserById('abcde')
      expect(user).toEqual({
        createdAt: jasmine.any(Date),
        deletedAt: null,
        email: null,
        id: '23530f2c-9838-4ba5-8fe6-d031609ba328',
        name: 'John Doe',
        nickname: 'jdoe',
        updatedAt: jasmine.any(Date)
      })
    })

    it('should return null if no user is found', async () => {
      mockKnex = Promise.resolve([])
      mockKnex.from = () => mockKnex
      mockKnex.where = () => mockKnex
      const { getUserById } = await esmock('../../src/users.js', {
        '../../src/database.js': {
          getDatabaseConnection: getDatabaseConnectionSpy
        }
      })
      const user = await getUserById('abcde')
      expect(user).toBe(null)
    })
  })
})
