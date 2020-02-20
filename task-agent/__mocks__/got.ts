import { cards } from '../test/fixtures/card'

let got: any = (url: string) => {
  let i = 0
  return {
    json: async (): Promise<any> => {
      return [{
        ...cards[i++ % 2],
        url
      }]
    }
  }
}

export default got
