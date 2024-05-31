import { config as loadEnvFile } from '@dotenvx/dotenvx'
import { parseEnv } from 'znv'
import { z } from 'zod'

loadEnvFile()

export const config = parseEnv(process.env, {
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.coerce.boolean().default(true)
})
