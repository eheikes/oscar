# OSCAR API Server

This project contains the API server for the OSCAR assistant. It is written for AWS Lambda and RDS.

## Installation & Usage

1. Create a Postgres DB in AWS RDS
1. Create a serverless instance in AWS Lambda
    * Set the handler to `index.handler`.

## API Reference

Coming soon

## Development

Developer scripts:

```
npm test
npm start               # run a local server
npm run build           # build the app
npm run build:release   # build the app for release (minified)
ARN=<LAMBDA ARN> npm run release  # upload & publish to AWS Lambda
```
