import jwt from 'jsonwebtoken'
import request from 'supertest'
import type Test from 'supertest/lib/test.js'

interface MockUserClaims {
  sub: string
  email: string
}

interface AuthedRequestClient {
  get: (path: string) => Test
  post: (path: string) => Test
  patch: (path: string) => Test
  delete: (path: string) => Test
}

const defaultClaims: MockUserClaims = {
  sub: 'auth0|e2e-user',
  email: 'e2e-user@example.com'
}

export const createMockToken = (claims: Partial<MockUserClaims> = {}): string => {
  const payload: MockUserClaims = {
    ...defaultClaims,
    ...claims
  }
  return jwt.sign(payload, 'test-secret')
}

export const authedRequest = (
  app: Parameters<typeof request>[0],
  claims: Partial<MockUserClaims> = {}
): AuthedRequestClient => {
  const token = createMockToken(claims)
  const withToken = (test: Test): Test => test.set('mock-token', token)

  return {
    get: (path: string) => withToken(request(app).get(path)),
    post: (path: string) => withToken(request(app).post(path)),
    patch: (path: string) => withToken(request(app).patch(path)),
    delete: (path: string) => withToken(request(app).delete(path))
  }
}
