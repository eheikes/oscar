import { cards } from '../../test/fixtures/card'

export const getListCards = jest.fn(() => Promise.resolve(cards))
