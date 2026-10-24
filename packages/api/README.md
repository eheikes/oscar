# OSCAR API Server

This project contains the API server for the OSCAR assistant. It is written for AWS Lambda and RDS.

## Installation & Usage

1. Create a Postgres DB in AWS RDS
    * Create the schemas defined in `test/mocks/postgres`.
1. Create a serverless instance in AWS Lambda
    * Set the handler to `index.handler`.
    * Under `Configuration -> General configuration`, set the memory to at least 512 MB and the timeout to at least 10 seconds. The defaults (128 MB, 3 seconds) are too small: Lambda allocates CPU in proportion to memory, and larger requests (e.g. `GET /items?count=100`) will time out and return a 500.
    * Set the required environment variables under `Configuration -> Environment variables`. See [`.env.test`](.env.test) for the list of variables and examples.
    * Set up an API gateway as the trigger.
    * Set throttling limits on the API gateway stage (and optionally an AWS WAF rate-based rule). The app's own rate limiting (`RATE_LIMITING_*` variables) is kept in memory, so each Lambda instance has its own count, and it resets on every cold start.
    * Consider setting a reserved concurrency on the Lambda, to cap how many instances (and DB connections) a flood of requests can create.
1. Download the [AWS RDS certificate bundle for your region](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html#UsingWithRDS.SSL.RegionCertificates) and replace the `rds-ca-bundle.pem` file in this `api` folder.
1. Rename `.env.example` to `.env` and update it with your configuration, _or_ set those variables in your environment.
    * Make sure `NODE_ENV` is _not_ set to `development`, and `MOCK_AUTH` is _not_ set.
1. Run `npm install && npm run migrate` to create/update the DB tables.
    * The Lambda does _not_ run migrations itself, so run this whenever you deploy a version with new migrations (before running the release).
1. Run `npm run build:release && ARN=YOUR_ARN npm run release`.
    * Replace `YOUR_ARN` with the ARN of your Lambda instance.

## API Reference

The API is documented as an OpenAPI (Swagger) YAML file at [docs/openapi.yaml](docs/openapi.yaml).

You can import this file into Swagger UI, Redoc, or other OpenAPI-compatible tooling.

## Authentication

All API endpoints require a valid Auth0 access token in the `Authorization` header.

Example:

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/items
```

Behavior:

- Missing or invalid token returns `401`.
- Authenticated users not in `ALLOWED_USERS` return `403`.
- CORS preflight (`OPTIONS`) requests are allowed without a token.

### Required authentication environment variables

- `OPENID_CLIENT_ID`: Auth0 application client ID.
- `OPENID_CLIENT_SECRET`: Auth0 application client secret.
- `OPENID_AUDIENCE`: **Required**. The **API Identifier** created under **Auth0 Dashboard > Applications > APIs** (e.g. `https://api.example.com` or `http://localhost:8080`). Must match the `VITE_AUTH0_AUDIENCE` configured in the web app.
  > **Note:** Do **not** use the Application Client ID. The API Identifier is needed so Auth0 issues signed RS256 JWTs that this API can verify against JWKS.
- `OPENID_URL`: Auth0 issuer URL (for example, `https://your-tenant.us.auth0.com`).
- `AUTH0_DOMAIN`: Optional explicit Auth0 domain. If omitted, it is derived from `OPENID_URL`.
- `ALLOWED_USERS`: **Required**. Comma-separated allowlist of Auth0 user IDs (the token's `sub` claim, e.g. `google-oauth2|1234567890`). You can find a user's ID under **Auth0 Dashboard > User Management > Users**. Email addresses are not accepted, since an unverified account can claim any email. The server will not start if this is unset or blank, so that it never allows every authenticated user by accident.

### Subtasks

Items support an optional `parentId` field (`parent_id` in the database) for parent/child relationships.

- `parentId` defaults to `null`.
- `parentId` can be provided on create or update only when the parent item exists.
- Parent items cannot be hard-deleted while they still have child items.
- Parent items cannot be soft-deleted (`deletedAt` set) until all child items are soft-deleted.
- `/items/next` ignores parent items while any child is still active (not soft-deleted).

## Integrations

Integrations connect OSCAR to other services. They're built in, but turned off by default. To enable integrations, set `INTEGRATIONS` to a comma-separated list of their IDs (e.g. `INTEGRATIONS=skylight`), along with any settings they need. The server won't start if an enabled integration is missing required settings.

The web app asks the API which integrations are enabled (`GET /integrations`), and only shows the features of those integrations.

### Skylight Calendar (`skylight`)

Lets you send tasks to a [Skylight Calendar](https://ourskylight.com/) as chores, either when adding a task or later from its edit form.

> **Note:** Skylight doesn't have an official public API. This integration uses the same API as Skylight's own apps, based on community research ([go-skylight](https://github.com/sebrandon1/go-skylight), [skylight-api](https://github.com/TheEagleByte/skylight-api)). It could stop working if Skylight changes that API.

Settings:

- `SKYLIGHT_AUTH_HEADER` (required): The full value of the `Authorization` header that Skylight's apps send, e.g. `Basic abc123...` or `Bearer abc123...`. Treat it like a password.
- `SKYLIGHT_FRAME_ID` (required): The ID of your Skylight frame (a number).
- `SKYLIGHT_CATEGORY_ID` (optional): The ID of the profile (Skylight calls these "categories") to assign chores to. If not set, chores are added as "up for grabs".
- `SKYLIGHT_TIMEZONE` (optional): The time zone of your Skylight, as an IANA name like `America/Chicago`. Used to convert a task's due date to the chore's date and time. Defaults to `UTC`.
- `SKYLIGHT_API_URL` (optional): Defaults to `https://app.ourskylight.com/api`.
- `SKYLIGHT_API_VERSION` (optional): The `skylight-api-version` header to send. Defaults to `2026-08-05`.

To find your auth header and frame ID:

1. Log in to the Skylight web app at [ourskylight.com](https://ourskylight.com/) in a desktop browser.
1. Open the browser's developer tools (F12), and go to the **Network** tab.
1. Open any page for your frame (e.g. the calendar or chores), so that the app makes some API requests.
1. Filter the requests for `api/frames`, and click on one, e.g. `https://app.ourskylight.com/api/frames/1234567/chores?...`.
    * The number after `/frames/` is your frame ID.
    * Under **Request Headers**, copy the full value of `Authorization` (including the `Basic` or `Bearer` part).
1. **Don't log out** of Skylight in that browser (just close the tab). Logging out can invalidate the token.

To find the ID of a profile to assign chores to, look for a request to `.../api/frames/{frame ID}/categories` in the Network tab, or run:

```bash
curl -H "Authorization: $SKYLIGHT_AUTH_HEADER" -H "Accept: application/json" "https://app.ourskylight.com/api/frames/$SKYLIGHT_FRAME_ID/categories"
```

Each entry in `data` has an `id`, and its `attributes.label` is the profile's name.

If sending to Skylight starts failing with "The Skylight API responded with status 401", the token has expired or been revoked. Repeat the steps above to get a new one. (The server logs have more details about failures.) Skylight hasn't documented how long its tokens last. `Basic` tokens seem to last until you log out, but `Bearer` tokens may expire much sooner.

How tasks are converted to chores:

- The item's title becomes the chore's title, and its summary becomes the chore's description.
- The due date is converted to the date and time in `SKYLIGHT_TIMEZONE`. A due time of midnight is treated as "any time that day", so the chore gets no time.
- Tasks without a due date are added for today.
- Only items with the `task` type can be sent. Sending a task again creates another chore. OSCAR doesn't keep track of which tasks have been sent, and changes to the task aren't synced to Skylight.

## Development

Remember to set your environment variables (using `.env` or other method) to configure the app. Set a `NODE_ENV` environment variable to `development` for debugging.

Scripts for local development:

* Run a local server: `NODE_ENV=local npm start`. This runs any pending DB migrations first.
* Run DB migrations: `npm run migrate`.
* Lint the files: `npm run lint`.
* Build the app: `npm run build`. Run `npm run build:release` to minify the files.
* Upload & publish to AWS Lambda: `ARN=<LAMBDA ARN> npm run release`
    * Replace `<LAMBDA ARN>` with your Lambda function's ARN.

For running automated tests:

* To run all tests: `npm run test`.
* You can use the `.env` or `.env.(NODE_ENV value)` files to set the environment values. Values in `.env.(NODE_ENV value)` take precedence over `.env`, and variables already set in the environment take precedence over both. If `NODE_ENV` is not set, only `.env` is loaded.
* The tests use mock credentials (a `mock-token` header or a mock session cookie) instead of real Auth0 tokens. Set `MOCK_AUTH=true` in `.env.test` to accept them. The server refuses to start with `MOCK_AUTH` enabled unless `NODE_ENV` is `development`, `local`, or `test` and `APP_URL` is a localhost URL.
* To run end-to-end tests:
    1. Start a local Postgres server. You can run a temporary server with Docker using something like `docker run -v ./test/mocks/postgres:/docker-entrypoint-initdb.d -e POSTGRES_PASSWORD=test -d -p 5432:5432 postgres`.
    1. Update `.env.test` to match the database credentials.
    1. Run `npm run test:e2e`.

### Dev Troubleshooting

#### `npm start` crashes with uncaught exception

If you see:

```
node:internal/process/esm_loader:46
      internalBinding('errors').triggerUncaughtException(
                                ^
[Object: null prototype] {
  [Symbol(nodejs.util.inspect.custom)]: [Function: [nodejs.util.inspect.custom]]
}
```

It's probably a problem with the types. Run `npm run build` to see the error.

#### DB query isn't working

Add `DEBUG=knex:query` to your command to print out the Knex SQL queries.
