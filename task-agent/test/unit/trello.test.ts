import { Config, getConfig } from '../../src/config'
import { addCard, getCurrentUser, getListCards, NewTrelloCard } from '../../src/trello'
import { user as exampleUser } from '../fixtures/user'

jest.mock('../../src/config')
jest.mock('../../src/log')

describe('trello', () => {
  let config: Config

  beforeEach(async () => {
    config = await getConfig()
  })

  describe('addCard()', () => {
    it('should POST the card data to Trello', async () => {
      const card: NewTrelloCard = {
        name: 'New Card',
        desc: 'Description',
        idList: 'list-id',
        due: new Date()
      }
      const newCard = await addCard(card)
      expect(newCard.name).toBe(card.name)
      expect(newCard.desc).toBe(card.desc)
      expect(newCard.idList).toBe(card.idList)
    })
  })

  describe('getCurrentUser()', () => {
    it('should return info about the authenticated user', async () => {
      const user = await getCurrentUser()
      expect(user.id).toBe(exampleUser.id)
    })
  })

  describe('getListCards()', () => {
    const extractListId = (card: any): string => {
      return card.url.replace(/^.*\/lists\/(.+)\/cards\/.*$/, '$1')
    }

    it('should query Trello for each list ID', async () => {
      const ids = ['foo', 'bar', 'baz']
      const cards = await getListCards(ids)
      expect(cards.map(extractListId)).toEqual(ids)
    })

    it('should work when given a single list ID', async () => {
      const cards = await getListCards('foo')
      expect(cards.map(extractListId)).toEqual(['foo'])
    })

    it('should limit results based on the given option', async () => {
      const cards = await getListCards('foo', { numCards: 3 })
      expect(cards[0].url).toMatch(/\blimit=3\b/)
    })

    it('should limit to 100 results by default', async () => {
      const cards = await getListCards('foo')
      expect(cards[0].url).toMatch(/\blimit=100\b/)
    })

    it('should use the configured base URL', async () => {
      const cards = await getListCards('foo')
      expect(cards[0].url).toMatch(new RegExp(`^${config.trello.url}`))
    })

    it('should request all the card fields', async () => {
      const cards = await getListCards('foo')
      expect(cards[0].url).toMatch(/fields=.*\bdateLastActivity\b/)
      expect(cards[0].url).toMatch(/fields=.*\bdue\b/)
      expect(cards[0].url).toMatch(/fields=.*\bidBoard\b/)
      expect(cards[0].url).toMatch(/fields=.*\bidLabels\b/)
      expect(cards[0].url).toMatch(/fields=.*\bidMembers\b/)
      expect(cards[0].url).toMatch(/fields=.*\bidShort\b/)
      expect(cards[0].url).toMatch(/fields=.*\blabels\b/)
      expect(cards[0].url).toMatch(/fields=.*\bname\b/)
      expect(cards[0].url).toMatch(/fields=.*\bpos\b/)
      expect(cards[0].url).toMatch(/fields=.*\bshortLink\b/)
      expect(cards[0].url).toMatch(/fields=.*\bshortUrl\b/)
      expect(cards[0].url).toMatch(/fields=.*\burl\b/)
    })

    it('should return all the cards merged into one set', async () => {
      const cards = await getListCards(['foo', 'bar'])
      expect(cards[0].url).toContain('/lists/foo/cards')
      expect(cards[1].url).toContain('/lists/bar/cards')
    })
  })
})
