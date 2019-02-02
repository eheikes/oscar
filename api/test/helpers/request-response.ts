import { Request, Response } from 'express'

interface Options {
  [key: string]: any
}


export const createFakeRequest = (opts: Options = {}): jasmine.SpyObj<Request> => {
  // Properties that can be set on (fake) Express requests.
  const allowedProps = [
    'baseUrl',
    'body',
    'cookies',
    'headers',
    'method',
    'originalUrl',
    'path',
    'protocol',
    'query'
  ]
  let req = jasmine.createSpyObj<Request>('request', [
    // from https://expressjs.com/en/4x/api.html#req
    'accepts',
    'acceptsCharsets',
    'acceptsEncodings',
    'acceptsLanguages',
    'get',
    'is',
    'param',
    'range'
  ])
  // const props = Object.keys(opts)
  // props.filter(prop => allowedProps.includes(prop)).forEach(prop => {
  //   req[prop as keyof Request] = opts[prop]
  // })
  return req
}

export const createFakeResponse = (): jasmine.SpyObj<Response> => {
  const res = jasmine.createSpyObj<Response>('response', [
    // from https://expressjs.com/en/4x/api.html#res
    'append',
    'attachment',
    'cookie',
    'clearCookie',
    'download',
    'end',
    'format',
    'get',
    'json',
    'jsonp',
    'links',
    'location',
    'redirect',
    'render',
    'send',
    'sendFile',
    'sendStatus',
    'set',
    'status',
    'type',
    'vary'
  ])
  return res
}
