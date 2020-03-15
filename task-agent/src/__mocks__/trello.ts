import { cards } from '../../test/fixtures/card'
import { user } from '../../test/fixtures/user'

export const getCurrentUser = jest.fn(async () => Promise.resolve(user))
export const getListCards = jest.fn(async () => Promise.resolve(cards))
