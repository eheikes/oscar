import { RssCollector } from '../../src/collectors/rss-collector'

const testFeed = 'http://lorem-rss.herokuapp.com/feed'

describe('RSS collector', () => {
  let collector: RssCollector

  describe('retrieve()', () => {
    it('should return the items in the feed', () => {
      collector = new RssCollector(testFeed)
      return collector.retrieve().then(items => {
        expect(items.length).toBeGreaterThan(0)
        expect(items[0].title).toMatch(/lorem ipsum/i)
      })
    })

    it('should return a rejected promise if the request fails', () => {
      collector = new RssCollector('http://example.com/nonexistent.rss')
      return collector.retrieve().then(result => {
        expect(result).not.toBeDefined()
      }).catch(err => {
        expect(err).toEqual(jasmine.any(Error))
      })
    })

    it('should return a rejected promise if the URL is not a feed', () => {
      collector = new RssCollector('http://example.com/')
      return collector.retrieve().then(result => {
        expect(result).not.toBeDefined()
      }).catch(err => {
        expect(err).toEqual(jasmine.any(Error))
      })
    })
  })
})
