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
  OPENID_URL: z.string(),
  WORK_CHUNK_SIZE: z.coerce.number().default(30)
}
export type Config = DeepReadonlyObject<typeof fields>

let config: Config | null = null

// Helper function to allow mocking in tests
export const getConfig = (): Config => {
  if (config == null) {
    loadEnvFile({
      path: [`.env.${process.env.NODE_ENV ?? 'local'}`, '.env'],
      override: true
    })
    config = parseEnv(process.env, fields)
  }
  return config
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
