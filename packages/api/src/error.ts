import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

export class ClientError extends Error {
}

export const errorHandler = (err: Error, _req: Request, res: Response, next: NextFunction): void => {
  // Delegate to the default Express handler if headers have been sent.
  if (res.headersSent) {
    return next(err)
  }

  // Client errors should return a 4xx.
  if (err instanceof ClientError) {
    res.status(400)
    res.send({ error: err.message })
    return
  }
  if (err instanceof ZodError) {
    const validationError = fromZodError(err)
    res.status(400)
    res.send({ error: validationError.message })
    return
  }

  // All other errors can be a 500.
  res.status(500)
  res.send({ error: err.message })
}
