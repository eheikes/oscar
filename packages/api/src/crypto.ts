import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { getConfig } from './config.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

// Derive a separate key for secrets, so ENCRYPTION_KEY isn't used directly for two purposes.
const getKey = (): Buffer => {
  return Buffer.from(hkdfSync('sha256', getConfig().ENCRYPTION_KEY, '', 'oscar-stored-secrets', 32))
}

// Encrypts a secret for storing in the database, as "iv.authTag.ciphertext" (base64).
export const encryptSecret = (plaintext: string): string => {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64')).join('.')
}

// Throws if the value was tampered with, or encrypted with a different ENCRYPTION_KEY.
export const decryptSecret = (encrypted: string): string => {
  const [iv, authTag, ciphertext] = encrypted.split('.').map(part => Buffer.from(part, 'base64'))
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
