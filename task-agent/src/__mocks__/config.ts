import { Config } from '../config'

export const fakeConfig: Config = {
  email: {
    server: {
      host: 'smtp.example.com',
      port: 587,
      secure: true,
      username: 'example_username',
      password: 'example_password'
    },
    template: {
      plain: 'templates/email.txt',
      html: 'templates/email.html'
    },
    message: {
      from: '"John Doe" <jdoe@example.com>',
      to: 'a@example.com, b@example.com',
      subject: 'Your Daily Tasks'
    }
  },
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
  },
  todos: {
    defaultDue: 1209600,
    urgentTime: 604800,
    numUrgentImportant: 2,
    numImportant: 2,
    numUrgent: 2,
    numNotImportant: 1
  }
}

export const getConfig = async (): Promise<Config> => Promise.resolve(fakeConfig)
