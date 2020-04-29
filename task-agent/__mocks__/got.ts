import { cards } from '../test/fixtures/card'
import { user } from '../test/fixtures/user'

const got: any = (url: string, opts?: any) => {
  if (url.includes('/cards') && !opts) {
    let i = 0
    return {
      json: async (): Promise<any> => {
        return Promise.resolve([{
          ...cards[i++ % 2],
          url
        }])
      }
    }
  } else if (url.includes('/cards') && opts && opts.json) {
    const card = cards[0]
    card.name = opts.json.name
    card.desc = opts.json.desc || ''
    card.idList = opts.json.idList
    return {
      json: async () => Promise.resolve(card)
    }
  } else if (url.includes('/members/me')) {
    return {
      json: async (): Promise<any> => Promise.resolve(user)
    }
  } else {
    throw new Error(`no test fixture found for got call to ${url}`)
  }
}

got.post = got
export default got
