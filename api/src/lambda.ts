/**
 * Wrapper module for AWS Lambda.
 */
import { Context } from 'aws-lambda'
import { createServer, proxy } from 'aws-serverless-express'
import app from './app'

const server = createServer(app)
export const handler = (event: any, context: Context) => proxy(server, event, context)
