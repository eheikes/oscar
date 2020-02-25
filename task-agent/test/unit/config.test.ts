import { DotenvConfigOutput } from 'dotenv'
import { config } from '../../__mocks__/dotenv'
import { safeLoad } from '../../__mocks__/js-yaml'
import { getConfig, YamlConfig } from '../../src/config'
import { envConfig, yamlConfig } from '../fixtures/config'

describe('getConfig()', () => {
  const configSpy = config as jest.Mock<DotenvConfigOutput>
  const safeLoadSpy = safeLoad as jest.Mock<YamlConfig>

  it('should return the parsed YAML file', async () => {
    const config = await getConfig()
    expect(config.trello.url).toBe(yamlConfig.trello.url)
    expect(config.email.server.host).toBe(yamlConfig.email.server.host)
    expect(config.todos.defaultDue).toBe(yamlConfig.todos.defaultDue)
  })

  it('should include secrets from the environment variables', async () => {
    const config = await getConfig()
    expect(config.trello.apiKey).toBe(envConfig.TRELLO_KEY)
    expect(config.trello.apiToken).toBe(envConfig.TRELLO_TOKEN)
  })

  it('should memoize the config for subsequent requests', async () => {
    const config = await getConfig()
    configSpy.mockClear()
    safeLoadSpy.mockClear()
    const config2 = await getConfig()
    expect(configSpy).not.toHaveBeenCalled()
    expect(safeLoadSpy).not.toHaveBeenCalled()
    expect(config2).toEqual(config)
  })
})
