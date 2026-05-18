import { Request, Response, NextFunction } from 'express'
import { getItems, getNextItem } from './items.js'
import { getTypes } from './types.js'
import { render } from './webpage.js'

export type Controller = (req: Request, res: Response, next: NextFunction) => Promise<void>

export const getItemsController: Controller = async (req, res) => {
  const result = await getItems(req.query)
  res.json(result)
}

export const getNextItemController: Controller = async (req, res) => {
  const result = await getNextItem(req.query)
  res.json(result)
}

export const getProfileController: Controller = async (req, res) => {
  res.json(req.oidc.user)
}

export const getTypesController: Controller = async (req, res) => {
  const result = await getTypes(req.query)
  res.json(result)
}

export const getWebpageController: Controller = async (req, res) => {
  res.set('content-type', 'text/html')
  res.send(render({
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc?.user
  }))
}
