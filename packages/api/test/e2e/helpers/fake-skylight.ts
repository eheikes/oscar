import { createServer, type IncomingHttpHeaders } from 'node:http'
import { type AddressInfo } from 'node:net'

export interface FakeSkylightRequest {
  method: string
  url: string
  headers: IncomingHttpHeaders
  body: unknown
}

export interface FakeSkylightResponse {
  status: number
  body: unknown
}

// A fake Skylight API and OAuth token endpoint, which records the requests it gets.
export interface FakeSkylight {
  apiUrl: string
  oauthUrl: string
  requests: FakeSkylightRequest[]
  // Responses for API requests: queued ones first, then the default.
  apiResponses: FakeSkylightResponse[]
  apiResponse: FakeSkylightResponse
  // Responses for token requests: queued ones first, then the default.
  tokenResponses: FakeSkylightResponse[]
  tokenResponse: FakeSkylightResponse
  tokenDelayMs: number
  reset: () => void
  close: () => Promise<void>
}

const parseBody = (body: string, contentType = ''): unknown => {
  if (body === '') { return undefined }
  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(body))
  }
  return JSON.parse(body)
}

export const startFakeSkylight = async (): Promise<FakeSkylight> => {
  const fake = {
    requests: [],
    apiResponses: [],
    apiResponse: { status: 200, body: {} },
    tokenResponses: [],
    tokenResponse: { status: 200, body: {} },
    tokenDelayMs: 0
  } as unknown as FakeSkylight

  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      const url = req.url ?? ''
      fake.requests.push({ method: req.method ?? '', url, headers: req.headers, body: parseBody(body, req.headers['content-type']) })
      const isToken = url.startsWith('/oauth/token')
      const response = isToken
        ? fake.tokenResponses.shift() ?? fake.tokenResponse
        : fake.apiResponses.shift() ?? fake.apiResponse
      setTimeout(() => {
        res.writeHead(response.status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response.body))
      }, isToken ? fake.tokenDelayMs : 0)
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  fake.apiUrl = `http://127.0.0.1:${port}/api`
  fake.oauthUrl = `http://127.0.0.1:${port}/oauth/token`
  fake.reset = () => {
    fake.requests = []
    fake.apiResponses = []
    fake.apiResponse = { status: 200, body: {} }
    fake.tokenResponses = []
    fake.tokenResponse = { status: 200, body: {} }
    fake.tokenDelayMs = 0
  }
  fake.close = async () => { await new Promise(resolve => server.close(resolve)) }
  return fake
}

// Sets (or with undefined, removes) environment variables.
export const setEnv = (env: Record<string, string | undefined>): void => {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key)
    } else {
      process.env[key] = value
    }
  }
}
