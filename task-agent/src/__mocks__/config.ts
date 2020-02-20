export { Config } from '../config'

export const fakeConfig = {
  trello: {
    apiKey: 'api_key',
    apiToken: 'api_token',
    cardsPerList: 10,
    labels: {
      important: 'important label',
      unimportant: 'unimportant label'
    },
    lists: ['list1', 'list2'],
    url: 'http://example.com'
  }
}

export const getConfig = async () => fakeConfig
