import { config as loadEnvFile } from 'dotenv'
import { parseEnv, Schemas } from 'znv'
import { z } from 'zod'

// znv doesn't export DeepReadonlyObject, so infer it ourselves.
type DeepReadonlyObject<T extends Schemas> = ReturnType<typeof parseEnv<T>>

const fields = {
  APP_URL: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.coerce.boolean().default(true),
  ENCRYPTION_KEY: z.string(),
  NODE_ENV: z.string().optional(),
  OPENID_CLIENT_ID: z.string(),
  OPENID_CLIENT_SECRET: z.string(),
  OPENID_URL: z.string()
}
export type Config = DeepReadonlyObject<typeof fields>

let config: Config | null = null

// Helper function to allow mocking in tests
export const getConfig = (): Config => {
  if (config == null) {
    loadEnvFile()
    config = parseEnv(process.env, fields)
  }
  return config
}

export const isDevelopment = (): boolean => {
  const config = getConfig()
  return config.NODE_ENV === 'development'
}

// Helper function for tests
export const clearConfig = /* c8 ignore next */ (): void => {
  config = null
}
