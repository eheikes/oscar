import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret } from '../../src/crypto.js'

describe('crypto', () => {
  it('should decrypt what it encrypts', () => {
    const encrypted = encryptSecret('my secret token')
    expect(encrypted).not.toContain('my secret token')
    expect(decryptSecret(encrypted)).toBe('my secret token')
  })

  it('should encrypt the same value differently each time', () => {
    expect(encryptSecret('my secret token')).not.toBe(encryptSecret('my secret token'))
  })

  it('should detect tampering', () => {
    const [iv, authTag, ciphertext] = encryptSecret('my secret token').split('.')
    const tampered = Buffer.from(ciphertext, 'base64')
    tampered[0] ^= 1
    expect(() => decryptSecret([iv, authTag, tampered.toString('base64')].join('.'))).toThrow()
  })
})
