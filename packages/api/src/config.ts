import { config as loadEnvFile } from 'dotenv'
import { parseEnv, Schemas } from 'znv'
import { z } from 'zod'

// znv doesn't export DeepReadonlyObject, so infer it ourselves.
type DeepReadonlyObject<T extends Schemas> = ReturnType<typeof parseEnv<T>>

const fields = {
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.coerce.boolean().default(true)
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

// Helper function for tests
export const clearConfig = (): void => {
  config = null
}
