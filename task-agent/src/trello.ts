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
  desc: string
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

export interface TrelloList {
  closed: boolean
  id: string
  idBoard: string
  name: string
  pos: number
}

export interface NewTrelloCard {
  desc?: string
  due: Date
  idList: string
  name: string
}

export interface TrelloPluginData {
  id: string
  idPlugin: string
  scope: string
  idModel: string
  value: string
  access: string
}

export interface CardSizePluginValue {
  size: number
  spent: number
  cardLastActivity: string
}

// Note: Not all fields from the Trello API are included.
export interface TrelloMember {
  id: string
}

export type CardFilter = (c: TrelloCard) => boolean

const getAuthParams = async (): Promise<string> => {
  const { trello: { apiKey, apiToken } } = await getConfig()
  return `key=${apiKey}&token=${apiToken}`
}

const sanitizeUrl = (url: string): string => {
  return url.replace(/(key=)\w+/g, '$1XXX').replace(/(token=)\w+/g, '$1XXX')
}

export const addCard = async (card: NewTrelloCard): Promise<TrelloCard> => {
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/cards?${auth}`
  try {
    log('addCard', `Creating card ${sanitizeUrl(url)}`)
    const newCard = await got.post(url, {
      json: {
        name: card.name,
        desc: card.desc,
        pos: 'bottom',
        due: card.due.toISOString(),
        idList: card.idList
      }
    }).json<TrelloCard>()
    // Trello doesn't support updating plugin data through its REST API, so we can't set a card size.
    // See https://developer.atlassian.com/cloud/trello/power-ups/client-library/getting-and-setting-data/#rest-api-access
    return newCard
  } catch (err) {
    log('addCard', 'ERROR!', err)
    throw err
  }
}

export const updateCard = async (cardId: string, changes: Partial<TrelloCard>): Promise<TrelloCard> => {
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/cards/${cardId}?${auth}`
  try {
    log('updateCard', `Updating card ${sanitizeUrl(url)}`)
    const updatedCard = await got.put(url, {
      json: changes
    }).json<TrelloCard>()
    return updatedCard
  } catch (err) {
    log('updateCard', 'ERROR!', err)
    throw err
  }
}

export const archiveAllInList = async (listId: string): Promise<void> => {
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/lists/${listId}/archiveAllCards?${auth}`
  try {
    log('archiveAllInList', `Archiving cards ${sanitizeUrl(url)}`)
    await got.post(url)
  } catch (err) {
    log('archiveAllInList', 'ERROR!', err)
    throw err
  }
}

/**
 * See https://support.atlassian.com/trello/docs/getting-the-time-a-card-or-board-was-created/
 */
export const getCardCreationTime = (card: TrelloCard): Date => {
  const timestampHex = card.id.substring(0, 8)
  const timestamp = parseInt(timestampHex, 16) * 1000
  return new Date(timestamp)
}

export const getCardPluginData = async (cardId: string): Promise<TrelloPluginData[]> => {
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/card/${cardId}/pluginData/?${auth}`
  try {
    log('getCardPluginData', `Retrieving ${sanitizeUrl(url)}`)
    return got(url).json<TrelloPluginData[]>()
  } catch (err) {
    log('getCardPluginData', 'ERROR!', err)
    throw err
  }
}

export const getCurrentUser = async (): Promise<TrelloMember> => {
  log('getCurrentUser', 'Retrieving authenticated user')
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  // "me" user is not well-documented: https://stackoverflow.com/a/54444336
  const url = `${baseUrl}/members/me?${auth}&fields=id`
  return got(url).json<TrelloMember>()
}

export const getList = async (id: string): Promise<TrelloList> => {
  log('getList', 'Retrieving list', id)
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/lists/${id}?${auth}`
  log('getList', `Calling ${sanitizeUrl(url)}`)
  return await got(url).json<TrelloList>()
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

/**
 * Returns a filtering function to only include cards that:
 *   1) have no one assigned to them, or
 *   2) have the specified user assigned to them
 */
export const isUserCard = (userId: string): CardFilter => {
  return (card: TrelloCard) =>
    card.idMembers.length === 0 ||
    card.idMembers.includes(userId)
}

export const moveCardToList = async (cardId: string, boardId: string, listId: string): Promise<void> => {
  log('moveCardToList', `Moving card ${cardId} to board ${boardId}, list ${listId}`)
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/cards/${cardId}?${auth}`
  try {
    log('moveCardToList', `Updating card ${sanitizeUrl(url)}`)
    await got.put(url, {
      json: {
        idBoard: boardId,
        idList: listId
      }
    })
  } catch (err) {
    log('moveCardToList', 'ERROR!', err)
    throw err
  }
}

export const renameCard = async (cardId: string, newName: string): Promise<void> => {
  log('renameCard', `Renaming card ${cardId} to "${newName}`)
  const auth = await getAuthParams()
  const { trello: { url: baseUrl } } = await getConfig()
  const url = `${baseUrl}/cards/${cardId}?${auth}`
  try {
    log('renameCard', `Updating card ${sanitizeUrl(url)}`)
    await got.put(url, {
      json: {
        name: newName
      }
    })
  } catch (err) {
    log('renameCard', 'ERROR!', err)
    throw err
  }
}
