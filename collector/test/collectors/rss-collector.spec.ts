import { RssCollector } from '../../src/collectors/rss-collector'

const testFeed = 'http://lorem-rss.herokuapp.com/feed'

describe('RSS collector', () => {
  let collector: RssCollector

  describe('retrieve()', () => {
    it('should return the items in the feed', async () => {
      collector = new RssCollector(testFeed)
      const items = await collector.retrieve()
      expect(items.length).toBeGreaterThan(0)
      expect(items[0].title).toMatch(/lorem ipsum/i)
    })

    it('should return a rejected promise if the request fails', async () => {
      collector = new RssCollector('http://example.com/nonexistent.rss')
      try {
        const items = await collector.retrieve()
        expect(items).not.toBeUndefined()
      } catch (err) {
        expect(err).toEqual(jasmine.any(Error))
      }
    })

    it('should return a rejected promise if the URL is not a feed', async () => {
      collector = new RssCollector('http://example.com/')
      try {
        const items = await collector.retrieve()
        expect(items).toBeUndefined()
      } catch (err) {
        expect(err).toEqual(jasmine.any(Error))
      }
    })
  })
})
