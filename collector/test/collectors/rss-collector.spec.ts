import { RssCollector } from '../../src/collectors/rss-collector'

const testFeed = 'http://lorem-rss.herokuapp.com/feed'

describe('RSS collector', () => {
  let collector: RssCollector
  let items: OscarItem[]

  describe('retrieve()', () => {
    beforeEach(() => {
      items = []
    })

    describe('when successful', () => {
      beforeEach(async () => {
        collector = new RssCollector(testFeed)
        items = await collector.retrieve()
      })

      it('should return the items in the feed', async () => {
        expect(items.length).toBeGreaterThan(0)
        expect(items[0].title).toMatch(/lorem ipsum/i)
      })

      it('should log a success', async () => {
        expect(collector.logs.length).toBeGreaterThan(0)
        expect(collector.logs[0].numErrors).toBe(0)
      })
    })

    describe('when the request fails', () => {
      beforeEach(async () => {
        collector = new RssCollector('http://example.com/nonexistent.rss')
        try {
          items = await collector.retrieve()
        } catch (e) {
          // swallow the error
        }
      })

      it('should return no items', async () => {
        expect(items).toEqual([])
      })

      it('should log a failure', async () => {
        expect(collector.logs.length).toBeGreaterThan(0)
        expect(collector.logs[0].numErrors).toBeGreaterThan(0)
        expect(collector.logs[0].log).not.toBe('')
      })
    })

    describe('when the requested URL is not a feed', () => {
      beforeEach(async () => {
        collector = new RssCollector('http://example.com/')
        try {
          items = await collector.retrieve()
        } catch (e) {
          // swallow the error
        }
      })

      it('should return no items', async () => {
        expect(items).toEqual([])
      })

      it('should log a failure', async () => {
        expect(collector.logs.length).toBeGreaterThan(0)
        expect(collector.logs[0].numErrors).toBeGreaterThan(0)
        expect(collector.logs[0].log).not.toBe('')
      })
    })
  })
})
