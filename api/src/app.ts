import * as express from 'express'
import { resolve }  from 'path'
import { getConfig } from './lib/config'
import { getItem, getItems } from './controllers/item'
import { getTypes } from './controllers/type'

const controllers: {[key: string]: express.RequestHandler} = {
  getItem, getItems, getTypes
}

const config = getConfig(resolve(__dirname, '..'))
const app = express()

config.routes.forEach(route => {
  app[route.method](route.path, controllers[route.controller])
})

export default app
