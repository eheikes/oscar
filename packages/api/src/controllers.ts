import { Request, Response, NextFunction } from 'express'
import { getItems } from './items.js'

export type Controller = (req: Request, res: Response, next: NextFunction) => Promise<void>

export const getItemsController: Controller = async (req, res) => {
  const result = await getItems(req.query)
  res.json(result)
}
