import { create, email } from '../../src/agent'
import { Config, getConfig } from '../../src/config'
import { EmailResult, sendEmail } from '../../src/email'
import { Task } from '../../src/task'
import { addCard, getListCards, TrelloCard } from '../../src/trello'
import { cards } from '../fixtures/card'

jest.mock('../../src/email')
jest.mock('../../src/log')
jest.mock('../../src/trello')

describe('agent', () => {
  describe('create', () => {
    const addCardSpy = addCard as jest.Mock<Promise<TrelloCard>>
    let config: Config

    beforeEach(async () => {
      config = await getConfig()
      addCardSpy.mockClear()
    })

    it('should call addCard() for each todo', async () => {
      await create(config)
      expect(addCardSpy.mock.calls.length).toBe(config.todos.recurring?.length)
    })

    it('should do nothing if there are no recurring todos', async () => {
      config.todos.recurring = []
      await create(config)
      expect(addCardSpy).not.toHaveBeenCalled()
    })
  })

  describe('email', () => {
    const sendEmailSpy = sendEmail as jest.Mock<Promise<EmailResult>>
    let config: Config

    beforeEach(async () => {
      config = await getConfig()
      await email(config)
    })

    it('should retrieve the Trello cards', () => {
      expect(getListCards).toHaveBeenCalledWith(
        config.trello.lists,
        { numCards: config.trello.cardsPerList }
      )
    })

    it('should filter out tasks assigned to others', () => {
      const args = sendEmailSpy.mock.calls[0]
      expect(args[2].some((t: Task) => t.id === cards[3].id)).toBe(false)
    })

    it('should sort the tasks into buckets', () => {
      const args = sendEmailSpy.mock.calls[0]
      expect(args[0].length).toBe(1)
      expect(args[0][0].id).toBe(cards[0].id)
      expect(args[0][0].size).toBe(config.todos.urgentAmount) // card hits max amount
      expect(args[1]).toEqual([])
      expect(args[2].length).toBe(2)
      expect(args[2][0].id).toBe(cards[1].id)
    })

    it('should send an email', () => {
      expect(sendEmailSpy).toHaveBeenCalled()
    })
  })
})
