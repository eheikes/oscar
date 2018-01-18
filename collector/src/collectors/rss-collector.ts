import * as FeedParser from 'feedparser'
import * as findPackageDir from 'pkg-dir'
import * as path from 'path'
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
    let items: OscarItem[] = []
    let log = this.createLog()
    try {
      const file = await this.requestFile()
      const parsedItems = await this.parseFile(file)
      items = parsedItems.map(this.normalizeItem)
    } catch (err) {
      log.log = err
      log.numErrors = 1
    }
    this.addLog(log)
    return items
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
    const pkgPath = await findPackageDir(__dirname)
    /* istanbul ignore if */
    if (!pkgPath) {
      throw new Error('Could not find package.json')
    }
    const pkg = require(path.join(pkgPath, 'package.json'))
    return request({
      uri: this.uri,
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': `${pkg.name}/${pkg.version}`
      },
      timeout: 10000,
      pool: false
    })
  }
}
