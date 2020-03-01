import { cards } from '../../test/fixtures/card'

export const getListCards = jest.fn(async () => Promise.resolve(cards))
