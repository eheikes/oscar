import { Request, Response } from 'express'
import { getDatabaseConnection } from '../lib/database'

export const getTypes = async (req: Request, res: Response) => {
  const db = getDatabaseConnection()
  try {
    const result = await db.query('SELECT * FROM types')
    res.json(result)
  } catch (e) {
    res.sendStatus(500)
  }
}
