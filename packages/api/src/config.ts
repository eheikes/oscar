import { config as loadEnvFile } from 'dotenv'
import { parseEnv } from 'znv'
import { z } from 'zod'

const fields = {
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.coerce.boolean().default(true)
}
const schema = z.object(fields)
export type Config = z.infer<typeof schema>

loadEnvFile()

const config = parseEnv(process.env, fields)

// Helper function to allow mocking in tests
export const getConfig = (): typeof config => {
  return config
}
