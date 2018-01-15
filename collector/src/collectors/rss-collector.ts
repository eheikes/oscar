import * as FeedParser from 'feedparser'
import * as request from 'request-promise-native'
import { Readable } from 'stream'
import { BaseCollector } from './base-collector'

export class RssCollector extends BaseCollector {
  id = 'rss'
  name = 'RSS Collector'

  constructor (private uri: string) {
    super()
  }

  async retrieve (): Promise<OscarItem[]> {
    return this.requestFile().then(file => {
      return this.parseFile(file)
    }).then(parsedItems => {
      return parsedItems.map(this.normalizeItem)
    })
  }

  private normalizeItem (item: FeedParser.Item): OscarItem {
    return {
      uuid: item.guid,
      uri: item.link,
      title: item.title,
      author: item.author,
      summary: item.summary,
      language: item.meta.language || null,
      imageUri: item.image.url || null,
      length: item.description.length,
      rating: null,
      due: null,
      rank: null,
      expectedRank: null,
      categories: item.categories,
      createdAt: item.pubdate ? item.pubdate : /* istanbul ignore next */ new Date(),
      deletedAt: null
    }
  }

  private async parseFile (xml: string): Promise<FeedParser.Item[]> {
    const feedparser = new FeedParser({})
    const s = new Readable()
    return new Promise<FeedParser.Item[]>((resolve, reject) => {
      const items: FeedParser.Item[] = []
      feedparser.on('error', (err: Error) => { reject(err) })
      feedparser.on('end', () => { resolve(items) })
      feedparser.on('readable', function () {
        let item: FeedParser.Item
        /* tslint:disable:no-conditional-assignment */
        while (item = feedparser.read()) {
        /* tslint:enable:no-conditional-assignment */
          items.push(item)
        }
      })
      s.pipe(feedparser)
      s.push(xml)
      s.push(null)
    })
  }

  private async requestFile (): Promise<string> {
    return request({
      uri: this.uri,
      timeout: 10000,
      pool: false
    })
  }
}
