import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { isDevelopment } from './config.js'

export class AuthorizationError extends Error {}

export class ClientError extends Error {}

export class MissingRouteError extends Error {}

export const errorHandler = (err: Error, _req: Request, res: Response, next: NextFunction): void => {
  // Delegate to the default Express handler if headers have been sent.
  if (res.headersSent) {
    return next(err)
  }

  // Invalid route should return a 404.
  if (err instanceof MissingRouteError) {
    res.status(404)
    res.send({ error: err.message })
    return
  }

  // Client errors should return a 4xx.
  if (err instanceof AuthorizationError) {
    res.status(403)
    res.send({ error: 'Unauthorized' })
    return
  }
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
  if (isDevelopment()) {
    console.log('Error!', err)
  }
  res.status(500)
  res.send({ error: err.message })
}

export const throw404 = (req: Request): never => {
  throw new MissingRouteError(`No matching route for ${req.method} ${req.url}`)
}
