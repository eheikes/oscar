import { main } from '../../src/agent'
import { Config, getConfig } from '../../src/config'
import { EmailResult, sendEmail } from '../../src/email'
import { Task } from '../../src/task'
import { getListCards } from '../../src/trello'
import { cards } from '../fixtures/card'

jest.mock('../../src/email')
jest.mock('../../src/log')
jest.mock('../../src/trello')

describe('agent', () => {
  const sendEmailSpy = sendEmail as jest.Mock<Promise<EmailResult>>
  let config: Config

  beforeEach(async () => {
    config = await getConfig()
    await main()
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
