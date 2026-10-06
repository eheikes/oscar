import { Request, Response, NextFunction } from 'express'
import { addItem, deleteItem, getItem, getItems, getNextItem, getRetroItems, updateItem } from './items.js'
import { getLabels } from './labels.js'
import { getTypes } from './types.js'
import { render } from './webpage.js'

export type Controller<P = Record<string, string>> = (req: Request<P>, res: Response, next: NextFunction) => Promise<void>

interface ItemParams { itemId: string }

export const addItemController: Controller = async (req, res) => {
  const result = await addItem(req.query, req.body)
  res.status(201).json(result)
}

export const deleteItemController: Controller<ItemParams> = async (req, res) => {
  await deleteItem(req.params.itemId)
  res.sendStatus(204)
}

export const updateItemController: Controller<ItemParams> = async (req, res) => {
  const result = await updateItem(req.params.itemId, req.body)
  res.status(200).json(result)
}

export const getItemController: Controller<ItemParams> = async (req, res) => {
  const result = await getItem(req.params.itemId)
  res.json(result)
}

export const getItemsController: Controller = async (req, res) => {
  const result = await getItems(req.query)
  res.json(result)
}

export const getNextItemController: Controller = async (req, res) => {
  const result = await getNextItem(req.query)
  res.json(result)
}

export const getRetroItemsController: Controller = async (req, res) => {
  const result = await getRetroItems(req.query)
  res.json(result)
}

export const getProfileController: Controller = async (req, res) => {
  res.json(req.user ?? {})
}

export const getTypesController: Controller = async (req, res) => {
  const result = await getTypes(req.query)
  res.json(result)
}

export const getLabelsController: Controller = async (req, res) => {
  const result = await getLabels()
  res.json(result)
}

export const getWebpageController: Controller = async (req, res) => {
  res.set('content-type', 'text/html')
  res.send(render({
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc?.user
  }))
}
