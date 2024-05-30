# OSCAR API Server

This project contains the API server for the OSCAR assistant. It is written for AWS Lambda and RDS.

## Installation & Usage

1. Create a Postgres DB in AWS RDS
    * Create the schemas defined in `test/mocks/postgres`.
1. Create a serverless instance in AWS Lambda
    * Set the handler to `index.handler`.
    * Set the required environment variables under `Configuration -> Environment variables`. See [`.env.test`](.env.test) for the list of variables and examples.
    * Set up an API gateway as the trigger.
1. Download the [AWS RDS certificate bundle for your region](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html#UsingWithRDS.SSL.RegionCertificates) and replace the `rds-ca-bundle.pem` file in this `api` folder.
1. Run `npm install && npm run build:release && ARN=YOUR_ARN npm run release`.
    * Replace `YOUR_ARN` with the ARN of your Lambda instance.

## API Reference

Coming soon

## Development

Scripts for local development:

* Run a local server: `npm start`.
* Build the app: `npm run build`. Run `npm run build:release` to minify the files.
* Upload & publish to AWS Lambda: `ARN=<LAMBDA ARN> npm run release`
    * Replace `<LAMBDA ARN>` with your Lambda function's ARN.

For running automated tests:

* To run all tests: `npm test`. This needs to be set up for both unit and E2E tests as described below.
* To run unit tests: `npm test:unit`.
* To run end-to-end tests:
    1. Start a local Postgres server. You can run a temporary server with Docker using something like `docker run -e POSTGRES_PASSWORD=test -d -p 5432:5432 postgres`.
    1. Update `.env.test` to match the database credentials.
    1. Run `npm test:e2e`.
