import { Request, Response } from 'express'
import { getItems } from './items.js'

export const getItemsController = async (req: Request, res: Response) => {
  const result = await getItems(req.query)
  res.json(result)
}
