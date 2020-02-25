import { envConfig } from '../test/fixtures/config'

export const config = jest.fn(() => ({
  parsed: envConfig
}))
