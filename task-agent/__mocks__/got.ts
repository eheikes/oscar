import { cards } from '../test/fixtures/card'

const got: any = (url: string) => {
  let i = 0
  return {
    json: async (): Promise<any> => {
      return Promise.resolve([{
        ...cards[i++ % 2],
        url
      }])
    }
  }
}

export default got
