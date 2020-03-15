import { cards } from '../test/fixtures/card'
import { user } from '../test/fixtures/user'

const got: any = (url: string) => {
  if (url.includes('/cards')) {
    let i = 0
    return {
      json: async (): Promise<any> => {
        return Promise.resolve([{
          ...cards[i++ % 2],
          url
        }])
      }
    }
  } else if (url.includes('/members/me')) {
    return {
      json: async (): Promise<any> => Promise.resolve(user)
    }
  } else {
    throw new Error(`no test fixture found for got call to ${url}`)
  }
}

export default got
