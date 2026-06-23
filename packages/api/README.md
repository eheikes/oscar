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
1. Rename `.env.example` to `.env` and update it with your configuration, _or_ set those variables in your environment.
    * Make sure `NODE_ENV` is _not_ set to `development`.
1. Run `npm install && npm run build:release && ARN=YOUR_ARN npm run release`.
    * Replace `YOUR_ARN` with the ARN of your Lambda instance.

## API Reference

### `GET /items`

Returns a list of items. Requires authentication.

Query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `count` | number | `25` | Maximum number of items to return (capped at 100). |
| `includeDeleted` | boolean | `false` | Whether to include soft-deleted items. |
| `maximumRank` | number | — | Filter to items with rank ≤ this value. |
| `minimumRank` | number | — | Filter to items with rank ≥ this value. |
| `offset` | number | — | Number of items to skip. |
| `orderBy` | string | `createdAt` | Field to sort by. Use `random` for random order. |
| `orderDir` | `asc` \| `desc` | `desc` | Sort direction. |
| `search` | string | — | Filter by title (space-separated terms, case-insensitive). |
| `since` | ISO 8601 datetime | — | Filter to items created on or after this timestamp. |
| `type` | string or string[] | — | Filter by one or more item types. |

**Response `200 OK`** — array of item objects.

---

### `GET /items/next`

Returns the next recommended item(s) to work on.

Query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `count` | number | `1` | Number of items to return (capped at 100). |
| `label` | string or string[] | — | Filter candidates to items with at least one matching label. |
| `type` | string | *(required)* | Item type to recommend from. |

**Response `200 OK`** — array of `{ item, reason }` objects.

---

### `POST /items`

Creates a new item.

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `replace` | `"true"` | When set, deletes existing non-deleted items with the same `title` and `type` before inserting. |

Request body (JSON):

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✓ | Item title. |
| `type` | string | ✓ | Item type identifier. |
| `author` | string \| null | | Author name. |
| `due` | ISO 8601 datetime \| null | | Due date. |
| `expectedRank` | number \| null | | Expected priority rank. |
| `imageUri` | string \| null | | URL of an associated image. |
| `labels` | string[] | | Label identifiers to associate with the item. |
| `language` | string \| null | | Language code. |
| `length` | number \| null | | Estimated length or duration. |
| `rank` | number \| null | | Current priority rank. |
| `rating` | number \| null | | Rating value. |
| `summary` | string \| null | | Short description. |
| `uri` | string \| null | | URL associated with the item. |

**Response `201 Created`** — the created item object.

---

### `PATCH /items/:itemId`

Updates an existing item. Only the fields included in the request body are changed; omitted fields keep their current values. The item must exist.

Path parameters:

| Parameter | Type | Description |
|---|---|---|
| `itemId` | UUID | ID of the item to update. |

Request body (JSON) — all fields are optional:

| Field | Type | Description |
|---|---|---|
| `title` | string | Item title. |
| `type` | string | Item type identifier. |
| `author` | string \| null | Author name. |
| `deletedAt` | ISO 8601 datetime \| null | Value to store in the item's deletion timestamp. |
| `due` | ISO 8601 datetime \| null | Due date. |
| `expectedRank` | number \| null | Expected priority rank. |
| `imageUri` | string \| null | URL of an associated image. |
| `labels` | string[] | Replaces all existing labels with this list. Omit to leave labels unchanged. |
| `language` | string \| null | Language code. |
| `length` | number \| null | Estimated length or duration. |
| `rank` | number \| null | Current priority rank. |
| `rating` | number \| null | Rating value. |
| `summary` | string \| null | Short description. |
| `uri` | string \| null | URL associated with the item. |

The fields `id`, `createdAt`, and `updatedAt` cannot be included in the body — doing so results in a `400` error.

**Response `200 OK`** — the updated item object.
**Response `400 Bad Request`** — invalid `itemId` format or forbidden/invalid fields in body.
**Response `404 Not Found`** — no item with the given `itemId`.

---

### `DELETE /items/:itemId`

Deletes an item from the database.

Path parameters:

| Parameter | Type | Description |
|---|---|---|
| `itemId` | UUID | ID of the item to delete. |

**Response `204 No Content`** — item deleted.
**Response `400 Bad Request`** — invalid `itemId` format.
**Response `404 Not Found`** — no item with the given `itemId`.

---

### `GET /labels`

Returns the list of available labels.

**Response `200 OK`** — array of label objects.

---

### `GET /types`

Returns the list of available item types.

**Response `200 OK`** — array of type objects.

## Development

Remember to set your environment variables (using `.env` or other method) to configure the app. Set a `NODE_ENV` environment variable to `development` for debugging.

Scripts for local development:

* Run a local server: `NODE_ENV=local npm start`.
* Lint the files: `npm run lint`.
* Build the app: `npm run build`. Run `npm run build:release` to minify the files.
* Upload & publish to AWS Lambda: `ARN=<LAMBDA ARN> npm run release`
    * Replace `<LAMBDA ARN>` with your Lambda function's ARN.

For running automated tests:

* To run all tests: `npm run test`.
* You can use the `.env` or `.env.(NODE_ENV value)` files to set the environment values.
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
