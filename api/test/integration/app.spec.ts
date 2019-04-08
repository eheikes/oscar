import { resolve } from 'path'
import * as request from 'supertest'
import app from '../../src/app'
import { getConfig, RouteConfig } from '../../src/lib/config'

const isGet = (route: RouteConfig) => route.method === 'get'

const fillInPath = (path: string) => {
  return path.replace(/(\/):([^/]+)/g, '$1$2-test')
}

describe('app', () => {
  const routes = getConfig(resolve(__dirname, '..', '..')).routes.filter(isGet)

  routes.forEach(route => {
    it(`should respond to GET ${route.path}`, () => {
      return request(app)
        .get(fillInPath(route.path))
        .expect(200)
        .expect('Content-Type', /json/)
    })
  })

  it('should return CORS headers', () => {
    // Make an OPTIONS request so Access-Control-Allow-Methods is included.
    return request(app)
      .options(fillInPath(routes[0].path))
      .expect('Access-Control-Allow-Origin', /./)
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Allow-Methods', /GET/)
      .expect('Access-Control-Allow-Methods', /POST/)
      .expect('Access-Control-Allow-Methods', /PUT/)
      .expect('Access-Control-Allow-Methods', /DELETE/)
      .expect('Access-Control-Allow-Methods', /OPTIONS/)
  })
})
