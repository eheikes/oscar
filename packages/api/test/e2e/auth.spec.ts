import jwt from 'jsonwebtoken'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { clearConfig } from '../../src/config.js'

describe('authentication', () => {
  const originalAllowedUsers = process.env.ALLOWED_USERS

  beforeEach(() => {
    delete process.env.ALLOWED_USERS
    clearConfig()
  })

  afterEach(() => {
    if (originalAllowedUsers == null) {
      delete process.env.ALLOWED_USERS
    } else {
      process.env.ALLOWED_USERS = originalAllowedUsers
    }
    clearConfig()
  })

  it('should return 401 when no token is provided', async () => {
    await request(app)
      .get('/types')
      .expect(401)
      .then(response => {
        expect(response.body.error).toContain('Authorization')
      })
  })

  it('should return 403 when user is not allowlisted', async () => {
    process.env.ALLOWED_USERS = 'allowed@example.com,auth0|allowed-user'
    clearConfig()

    const token = jwt.sign({
      email: 'blocked@example.com',
      sub: 'auth0|blocked-user'
    }, 'test-secret')

    await request(app)
      .get('/types')
      .set('mock-token', token)
      .expect(403)
      .then(response => {
        expect(response.body.error).toBe('Unauthorized')
      })
  })

  it('should allow an allowlisted user with a valid token', async () => {
    process.env.ALLOWED_USERS = 'allowed@example.com,auth0|allowed-user'
    clearConfig()

    const token = jwt.sign({
      email: 'allowed@example.com',
      sub: 'auth0|other-user'
    }, 'test-secret')

    await request(app)
      .get('/types')
      .set('mock-token', token)
      .expect(200)
      .then(response => {
        expect(Array.isArray(response.body)).toBe(true)
      })
  })
})
