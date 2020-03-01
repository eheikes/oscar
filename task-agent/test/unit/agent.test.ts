import { main } from '../../src/agent'
import { Config, getConfig } from '../../src/config'
import { EmailResult, sendEmail } from '../../src/email'
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

  it('should sort the tasks into buckets', () => {
    const args = sendEmailSpy.mock.calls[0]
    expect(args[0].length).toBe(1)
    expect(args[0][0].id).toBe(cards[0].id)
    expect(args[1].length).toBe(1)
    expect(args[1][0].id).toBe(cards[1].id)
    expect(args[2]).toEqual([])
    expect(args[3]).toEqual([])
  })

  it('should send an email', () => {
    expect(sendEmailSpy).toHaveBeenCalled()
  })
})
