"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FeedParser = require("feedparser");
const findPackageDir = require("pkg-dir");
const path = require("path");
const request = require("request-promise-native");
const stream_1 = require("stream");
const base_collector_1 = require("./base-collector");
class RssCollector extends base_collector_1.BaseCollector {
    constructor(uri) {
        super();
        this.uri = uri;
        this.id = 'rss';
        this.name = 'RSS Collector';
    }
    async retrieve() {
        return this.requestFile().then(file => {
            return this.parseFile(file);
        }).then(parsedItems => {
            return parsedItems.map(this.normalizeItem);
        });
    }
    normalizeItem(item) {
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
        };
    }
    async parseFile(xml) {
        const feedparser = new FeedParser({});
        const s = new stream_1.Readable();
        return new Promise((resolve, reject) => {
            const items = [];
            feedparser.on('error', (err) => { reject(err); });
            feedparser.on('end', () => { resolve(items); });
            feedparser.on('readable', function () {
                let item;
                /* tslint:disable:no-conditional-assignment */
                while (item = feedparser.read()) {
                    /* tslint:enable:no-conditional-assignment */
                    items.push(item);
                }
            });
            s.pipe(feedparser);
            s.push(xml);
            s.push(null);
        });
    }
    async requestFile() {
        const pkgPath = await findPackageDir(__dirname);
        /* istanbul ignore if */
        if (!pkgPath) {
            throw new Error('Could not find package.json');
        }
        const pkg = require(path.join(pkgPath, 'package.json'));
        return request({
            uri: this.uri,
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': `${pkg.name}/${pkg.version}`
            },
            timeout: 10000,
            pool: false
        });
    }
}
exports.RssCollector = RssCollector;
