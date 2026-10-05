import { config as loadEnvFile } from 'dotenv'
import { parseEnv, Schemas } from 'znv'
import { z } from 'zod'

// znv doesn't export DeepReadonlyObject, so infer it ourselves.
type DeepReadonlyObject<T extends Schemas> = ReturnType<typeof parseEnv<T>>

const fields = {
  APP_URL: z.string(),
  ALLOWED_USERS: z.string().trim().min(1),
  AUTH0_DOMAIN: z.string().optional(),
  CORS_ALLOWED_ORIGIN: z.string().default(''), // empty string means CORS is disabled
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.coerce.boolean().default(true),
  DB_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true),
  DB_CA_FILE: z.coerce.string().optional(),
  ENCRYPTION_KEY: z.string(),
  MOCK_AUTH: z.boolean().default(false), // accept mock credentials; for local development & tests only
  NODE_ENV: z.string().optional(),
  OPENID_CLIENT_ID: z.string(),
  OPENID_AUDIENCE: z.string(),
  OPENID_CLIENT_SECRET: z.string(),
  OPENID_URL: z.string(),
  RATE_LIMITING_WINDOW: z.coerce.number().default(15 * 60 * 1000), // 15 mins
  RATE_LIMITING_MAX: z.coerce.number().default(100),
  RATE_LIMITING_IPV6_SUBNET: z.coerce.number().default(56),
  WORK_CHUNK_SIZE: z.coerce.number().default(30)
}
export type Config = DeepReadonlyObject<typeof fields>

let config: Config | null = null

// Helper function to allow mocking in tests
export const getConfig = (): Config => {
  if (config == null) {
    // First file wins, and existing environment variables are not overridden.
    // Without a NODE_ENV, only load .env, so a stray dev/test file can't change the environment.
    loadEnvFile({
      path: process.env.NODE_ENV === undefined ? ['.env'] : [`.env.${process.env.NODE_ENV}`, '.env']
    })
    const parsed = parseEnv(process.env, fields)
    assertSafeMockAuth(parsed)
    config = parsed
  }
  return config
}

const devEnvironments = ['development', 'local', 'test']
const localHostnames = ['localhost', '127.0.0.1', '[::1]']

// Mock auth bypasses all authentication, so refuse to start if it's enabled outside a local dev/test setup.
const assertSafeMockAuth = (config: Config): void => {
  if (!config.MOCK_AUTH) { return }
  if (!devEnvironments.includes(config.NODE_ENV ?? '')) {
    throw new Error(`MOCK_AUTH cannot be enabled when NODE_ENV is "${config.NODE_ENV ?? ''}"`)
  }
  const hostname = URL.canParse(config.APP_URL) ? new URL(config.APP_URL).hostname : ''
  if (!localHostnames.includes(hostname)) {
    throw new Error('MOCK_AUTH can only be enabled when APP_URL is a localhost URL')
  }
}

export const isMockAuthEnabled = (): boolean => {
  return getConfig().MOCK_AUTH
}

export const isLocal = (): boolean => {
  const config = getConfig()
  return config.NODE_ENV === 'local'
}

export const isDevelopment = (): boolean => {
  const config = getConfig()
  return config.NODE_ENV === 'development' || isLocal()
}

export const isTest = (): boolean => {
  const config = getConfig()
  return config.NODE_ENV === 'test'
}

// Helper function for tests
export const clearConfig = /* c8 ignore next */ (): void => {
  config = null
}
