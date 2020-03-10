import { EnvConfig, YamlConfig } from '../../src/config'

export const envConfig: EnvConfig = {
  TRELLO_KEY: 'trello key',
  TRELLO_TOKEN: 'trello token'
}

export const yamlConfig: YamlConfig = {
  trello: {
    url: 'https://api.trello.com/1',
    labels: {
      important: 'important',
      unimportant: 'not important'
    },
    lists: ['5b09d7346cad9862b28a687f'],
    cardsPerList: 200
  },
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
  todos: {
    defaultDue: 1209600,
    urgentTime: 604800,
    numUrgentImportant: 1,
    numImportant: 1,
    numUrgent: 1,
    numNotImportant: 1
  }
}
