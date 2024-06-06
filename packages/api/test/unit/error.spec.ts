import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { ClientError, errorHandler, MissingRouteError, throw404 } from '../../src/error.js'

describe('error', () => {
  let nextSpy: jasmine.Spy
  let resSpy: jasmine.Spy & Response
  const req: Request = {} as any

  beforeEach(() => {
    nextSpy = jasmine.createSpy('next')
    resSpy = jasmine.createSpyObj('res', ['send', 'status'])
    resSpy.headersSent = false
  })

  describe('errorHandler()', () => {
    it('should call the default error handler if headers have already been sent', () => {
      const err = new Error()
      resSpy.headersSent = true
      errorHandler(err, req, resSpy, nextSpy)
      expect(nextSpy).toHaveBeenCalledWith(err)
    })

    it('should return a 400 for client errors', () => {
      const err = new ClientError('Test Error')
      errorHandler(err, req, resSpy, nextSpy)
      expect(resSpy.status).toHaveBeenCalledWith(400)
      expect(resSpy.send).toHaveBeenCalledWith({ error: 'Test Error' })
    })

    it('should return a 400 for validation errors', () => {
      const err = new ZodError([{
        code: 'invalid_type',
        message: 'Test Error',
        path: ['foo'],
        expected: 'string',
        received: 'number'
      }])
      errorHandler(err, req, resSpy, nextSpy)
      expect(resSpy.status).toHaveBeenCalledWith(400)
      expect(resSpy.send).toHaveBeenCalledWith({ error: jasmine.any(String) })
    })

    it('should return a 404 for routing errors', () => {
      const err = new MissingRouteError('No matching route for GET /foo')
      errorHandler(err, req, resSpy, nextSpy)
      expect(resSpy.status).toHaveBeenCalledWith(404)
      expect(resSpy.send).toHaveBeenCalledWith({ error: 'No matching route for GET /foo' })
    })

    it('should return a 500 for other errors', () => {
      const err = new Error('Test Error')
      errorHandler(err, req, resSpy, nextSpy)
      expect(resSpy.status).toHaveBeenCalledWith(500)
      expect(resSpy.send).toHaveBeenCalledWith({ error: 'Test Error' })
    })
  })

  describe('throw404()', () => {
    it('should throw a MissingRouteError', () => {
      try {
        throw404({ method: 'GET', url: '/foo'} as Request)
        throw new Error('Should have thrown MissingRouteError')
      } catch (err) {
        expect(err).toEqual(jasmine.any(MissingRouteError))
      }
    })

    it('should include the method and path in the message', () => {
      try {
        throw404({ method: 'GET', url: '/foo'} as Request)
        throw new Error('Should have thrown MissingRouteError')
      } catch (err) {
        expect((err as MissingRouteError).message).toContain('GET')
        expect((err as MissingRouteError).message).toContain('/foo')
      }
    })
  })
})
