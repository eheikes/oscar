// Authentication for the Skylight API.
// Either uses a fixed Authorization header (SKYLIGHT_AUTH_HEADER), or gets short-lived access tokens
// with an OAuth refresh token, like Skylight's own apps. Refresh tokens change every time they're used,
// so the latest one is kept (encrypted) in the database, starting from SKYLIGHT_REFRESH_TOKEN.
import { createHash } from 'node:crypto'
import { type Config, getConfig } from '../config.js'
import { decryptSecret, encryptSecret } from '../crypto.js'
import { getDatabaseConnection } from '../database.js'
import { IntegrationError, UpstreamError } from '../error.js'
import { logger } from '../logger.js'

const INTEGRATION_ID = 'skylight'
const REQUEST_TIMEOUT_MS = 10000
const MAX_LOGGED_BODY_LENGTH = 1000
const EXPIRY_MARGIN_MS = 60 * 1000 // refresh a little early, so a token doesn't expire mid-request
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60

export interface DatabaseIntegrationToken {
  integration_id: string
  refresh_token: string | null
  access_token: string | null
  access_token_expires_at: Date | null
  seed_hash: string | null // hash of the configured refresh token that this row started from
  updated_at: Date
}

declare module 'knex/types/tables.js' {
  interface Tables {
    integration_tokens: DatabaseIntegrationToken
  }
}

interface OAuthTokenResponse {
  access_token?: unknown
  refresh_token?: unknown
  expires_in?: unknown
}

const isSet = (value: string | undefined): value is string => (value ?? '').trim() !== ''

export const usesRefreshToken = (config: Config = getConfig()): boolean => {
  return !isSet(config.SKYLIGHT_AUTH_HEADER)
}

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

// A new SKYLIGHT_REFRESH_TOKEN (e.g. after the old one was revoked) replaces the one in the database.
const getSeedHash = (config: Config): string | null => {
  return isSet(config.SKYLIGHT_REFRESH_TOKEN) ? hashToken(config.SKYLIGHT_REFRESH_TOKEN.trim()) : null
}

const getValidAccessToken = (row: DatabaseIntegrationToken | undefined, seedHash: string | null): string | null => {
  if (row?.access_token == null || row.access_token_expires_at === null) { return null }
  if (seedHash !== null && row.seed_hash !== seedHash) { return null }
  if (new Date(row.access_token_expires_at).getTime() - EXPIRY_MARGIN_MS <= Date.now()) { return null }
  return decryptSecret(row.access_token)
}

const requestTokens = async (config: Config, refreshToken: string): Promise<{ accessToken: string, refreshToken: string, expiresIn: number }> => {
  let res: Response
  try {
    res = await fetch(config.SKYLIGHT_OAUTH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.SKYLIGHT_OAUTH_CLIENT_ID,
        skylight_api_client_device_fingerprint: config.SKYLIGHT_DEVICE_FINGERPRINT ?? ''
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
  } catch (err) {
    logger.error({ err }, 'Skylight token request failed')
    throw new UpstreamError('Could not reach the Skylight login service')
  }

  if (!res.ok) {
    const body = (await res.text()).slice(0, MAX_LOGGED_BODY_LENGTH)
    logger.error({ status: res.status, body }, 'Skylight token request was rejected')
    throw new UpstreamError(res.status === 400 || res.status === 401
      ? `Skylight rejected the refresh token (status ${res.status}). Set a new SKYLIGHT_REFRESH_TOKEN on the server (see the README)`
      : `The Skylight login service responded with status ${res.status}`)
  }

  const body = await res.json().catch(() => null) as OAuthTokenResponse | null
  if (typeof body?.access_token !== 'string' || body.access_token === '') {
    throw new UpstreamError('The Skylight login service did not return an access token')
  }
  return {
    accessToken: body.access_token,
    // Keep using the old refresh token if it wasn't rotated.
    refreshToken: typeof body.refresh_token === 'string' && body.refresh_token !== '' ? body.refresh_token : refreshToken,
    expiresIn: typeof body.expires_in === 'number' && body.expires_in > 0 ? body.expires_in : DEFAULT_EXPIRES_IN_SECONDS
  }
}

interface RefreshOptions {
  force?: boolean // refresh even if the current access token is still valid
  rejectedToken?: string // refresh unless the current access token is a different one
}

// Gets a new access token, and saves the new refresh token.
// Locks the database row while refreshing, so that separate instances (e.g. Lambdas) don't use the
// same refresh token at the same time: only the first one would work, and Skylight might revoke it.
const refreshAccessToken = async ({ force = false, rejectedToken }: RefreshOptions): Promise<string> => {
  const config = getConfig()
  const seedHash = getSeedHash(config)
  const db = getDatabaseConnection()
  return await db.transaction(async trx => {
    await trx('integration_tokens').insert({ integration_id: INTEGRATION_ID }).onConflict('integration_id').ignore()
    const row = await trx('integration_tokens').where({ integration_id: INTEGRATION_ID }).forUpdate().first()

    // Another instance may have refreshed it while this one was waiting for the lock.
    const current = force ? null : getValidAccessToken(row, seedHash)
    if (current !== null && current !== rejectedToken) { return current }

    const useSeed = seedHash !== null && row?.seed_hash !== seedHash
    const refreshToken = useSeed
      ? (config.SKYLIGHT_REFRESH_TOKEN ?? '').trim()
      : row?.refresh_token == null ? '' : decryptSecret(row.refresh_token)
    if (refreshToken === '') {
      throw new IntegrationError('No Skylight refresh token is available. Set SKYLIGHT_REFRESH_TOKEN on the server (see the README)')
    }

    logger.info({ useSeed }, 'Refreshing Skylight access token')
    const tokens = await requestTokens(config, refreshToken)
    try {
      await trx('integration_tokens').update({
        refresh_token: encryptSecret(tokens.refreshToken),
        access_token: encryptSecret(tokens.accessToken),
        access_token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000),
        seed_hash: seedHash ?? row?.seed_hash ?? null,
        updated_at: new Date()
      }).where({ integration_id: INTEGRATION_ID })
    } catch (err) /* c8 ignore start */ {
      // The old refresh token has already been used up, so a new one will have to be set up by hand.
      logger.error({ err }, 'Could not save the new Skylight refresh token')
      throw err
    } /* c8 ignore stop */
    return tokens.accessToken
  })
}

// Returns the value for the Authorization header of Skylight API requests.
// Pass the header that Skylight rejected to get a new access token (if using a refresh token).
export const getAuthorizationHeader = async (rejectedHeader?: string): Promise<string> => {
  const config = getConfig()
  if (!usesRefreshToken(config)) {
    return (config.SKYLIGHT_AUTH_HEADER ?? '').trim()
  }
  if (rejectedHeader === undefined) {
    const db = getDatabaseConnection()
    const row = await db('integration_tokens').where({ integration_id: INTEGRATION_ID }).first()
    const accessToken = getValidAccessToken(row, getSeedHash(config))
    if (accessToken !== null) { return `Bearer ${accessToken}` }
  }
  const rejectedToken = rejectedHeader?.replace(/^Bearer /, '')
  return `Bearer ${await refreshAccessToken({ rejectedToken })}`
}

// Refreshes the tokens even if they're still valid, so that the refresh token doesn't sit unused
// long enough to expire. Meant to be run on a schedule. Does nothing with a fixed Authorization header.
export const keepTokensAlive = async (): Promise<void> => {
  if (!usesRefreshToken()) { return }
  await refreshAccessToken({ force: true })
  logger.info('Refreshed Skylight tokens')
}
