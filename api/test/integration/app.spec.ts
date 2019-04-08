import { resolve } from 'path'
import * as request from 'supertest'
import app from '../../src/app'
import { getConfig, RouteConfig } from '../../src/lib/config'

const isGet = (route: RouteConfig) => route.method === 'get'

const fillInPath = (path: string) => {
  return path.replace(/(\/):([^/]+)/g, '$1$2-test')
}

describe('app', () => {
  getConfig(resolve(__dirname, '..', '..')).routes.filter(isGet).forEach(route => {
    it(`should respond to GET ${route.path}`, () => {
      return request(app)
        .get(fillInPath(route.path))
        .expect(200)
        .expect('Content-Type', /json/)
    })
  })
})
