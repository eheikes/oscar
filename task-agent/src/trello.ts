import got from 'got'
import { getConfig } from './config'
import { log } from './log'

interface TrelloLabel {
  id: string
  idBoard: string
  name: string
  color: string
}

interface TrelloOptions {
  numCards?: number
}

// Note: Not all fields from the Trello API are included.
const cardFields = [
  'dateLastActivity',
  'due',
  'idBoard',
  'idLabels',
  'idMembers',
  'idShort',
  'labels',
  'name',
  'pos',
  'shortLink',
  'shortUrl',
  'url'
]
export interface TrelloCard {
  id: string
  dateLastActivity: string // date
  due: string | null // date
  idBoard: string
  idLabels: string[]
  idList: string
  idMembers: string[]
  idShort: string
  labels: TrelloLabel[]
  name: string
  pos: number
  shortLink: string
  shortUrl: string
  url: string
}

const getAuthParams = async (): Promise<string> => {
  const { trello: { apiKey, apiToken } } = await getConfig()
  return `key=${apiKey}&token=${apiToken}`
}

const sanitizeUrl = (url: string): string => {
  return url.replace(/(key=)\w+/g, '$1XXX').replace(/(token=)\w+/g, '$1XXX')
}

export const getCardPluginData = async (cardId: string): Promise<any> => {
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/card/${cardId}/pluginData/?${auth}`
  try {
    log('getCardPluginData', `Retrieving ${sanitizeUrl(url)}`)
    return got(url).json<TrelloCard[]>()
  } catch (err) {
    log('getCardPluginData', 'ERROR!', err)
    throw err
  }
}

export const getListCards = async (listIds: string | string[], opts: TrelloOptions = {}): Promise<TrelloCard[]> => {
  log('getListCards', 'Retrieving lists', listIds)

  if (!Array.isArray(listIds)) {
    listIds = [listIds]
  }

  /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing */
  const numCards = opts.numCards || 100

  const cards: TrelloCard[] = []
  const auth = await getAuthParams()
  log('getListCards', 'auth is', auth)
  try {
    for (const id of listIds) {
      const { trello: { url: baseUrl } } = await getConfig()
      const url = `${baseUrl}/lists/${id}/cards/?${auth}&fields=${cardFields.join(',')}&limit=${String(numCards)}`
      log('getListCards', `Calling ${sanitizeUrl(url)}`)
      const listCards = await got(url).json<TrelloCard[]>()
      for (const card of listCards) {
        // const pluginData = await getCardPluginData(card.id)
        // console.log('plugin data for card', card.id, ':', pluginData)
        cards.push(card)
      }
    }
  } catch (err) {
    log('getListCards', 'ERROR!', err)
    throw err
  }
  return cards
}
