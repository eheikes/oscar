import { cards } from '../../test/fixtures/card'
import { pluginData } from '../../test/fixtures/plugin-data'
import { user } from '../../test/fixtures/user'

export const addCard = jest.fn(async () => Promise.resolve(cards[0]))
export const getCardPluginData = jest.fn(async () => Promise.resolve(pluginData))
export const getCurrentUser = jest.fn(async () => Promise.resolve(user))
export const getListCards = jest.fn(async () => Promise.resolve(cards))
