# OSCAR API Server

This project contains the API server for the OSCAR assistant.

## Requirements

* [Node.js](https://nodejs.org/) or similar runtime
* PostgreSQL, MySQL, SQLite, or MSSQL database

## Installation & Usage

1. Install the software using npm (`npm install oscar-assistant-api`).
2. Configure the software for your database. Create a configuration file in the `config` folder for your environment, such as `production.yaml` or `local.yaml` (see [the configuration file documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files)). [The Sequelize documentation](http://sequelize.readthedocs.io/en/latest/api/sequelize/#new-sequelizedatabase-usernamenull-passwordnull-options) contains the available options.
3. Run `npm start` to start the server.

## API Reference

All endpoints receive and return JSON data.

Timestamps are in ISO 8601 format.

### `GET /collectors`

Returns all collectors, and the number of errors that occurred during the most recent collection.

```json
[{
  "id": "twitter-feed",
  "name": "Twitter",
  "numErrors": 0
}, {
  "id": "facebook-feed",
  "name": "Facebook",
  "numErrors": 2
}]
```

### `GET /collectors/:collectorId`

Returns the details for a collector.

```json
{
  "id": "twitter-feed",
  "name": "Twitter",
  "numErrors": 0
}
```

### `GET /collectors/:collectorId/logs`

Returns the most recent logs for a collector. By default it returns the logs in chronologically descending order.

```json
[{
  "id": 8959,
  "timestamp": "2017-01-13T02:31:35+00:00",
  "log": "multiline output\nnext line",
  "numErrors": 0
}, {
  "id": 8958,
  "timestamp": "2017-01-12T02:31:35+00:00",
  "log": "multiline output\nnext line",
  "numErrors": 2
}]
```

### `GET /types`

Returns all types.

```json
[{
  "id": "read",
  "readable": "read"
}, {
  "id": "watch",
  "readable": "watch"
}, {
  "id": "listen",
  "readable": "listen to"
}]
```

### `GET /types/:typeId?start&limit`

Returns the collected items for the given type. Deleted items are excluded.

By default it returns the items in descending ranked order.

The offset and number of items returned can be changed with the (zero-based) `start` and `limit` parameters.

```json
[{
  "id": 1842,
  "added": "2017-01-13T15:06:28+00:00",
  "deleted": null,
  "url": "http://example.com",
  "title": "Example Item",
  "author": "John Doe",
  "summary": "Item summary. May be multiline, but usually not.",
  "categories": ["work", "personal"],
  "length": 374,
  "rating": 7.2,
  "due": "2017-01-31T00:00:00+00:00",
  "rank": 6.52593,
  "expectedRank": null
}]
```

### `GET /types/:typeId/:itemId`

Return the item details.

```json
{
  "id": 1842,
  "added": "2017-01-13T15:06:28+00:00",
  "deleted": null,
  "url": "http://example.com",
  "title": "Example Item",
  "author": "John Doe",
  "summary": "Item summary. May be multiline, but usually not.",
  "categories": ["work", "personal"],
  "length": 374,
  "rating": 7.2,
  "due": "2017-01-31T00:00:00+00:00",
  "rank": 6.52593,
  "expectedRank": null
}
```

### `PATCH /types/:typeId/:itemId`

Changes an item. At this time the only changeable property is `expectedRank`:

```json
{
  "expectedRank": 6
}
```

Returns the changed item.

```json
{
  "id": 1842,
  "added": "2017-01-13T15:06:28+00:00",
  "deleted": null,
  "url": "http://example.com",
  "title": "Example Item",
  "author": "John Doe",
  "summary": "Item summary. May be multiline, but usually not.",
  "categories": ["work", "personal"],
  "length": 374,
  "rating": 7.2,
  "dueDate": "2017-01-31T00:00:00+00:00",
  "rank": 6.52593,
  "expectedRank": 6
}
```

### `DELETE /types/:typeId/:itemId`

Marks an item as deleted. Returns the changed item with the `deleted` time.

```json
{
  "id": 1842,
  "added": "2017-01-13T15:06:28+00:00",
  "deleted": "2017-01-15T08:21:54+00:00",
  "url": "http://example.com",
  "title": "Example Item",
  "author": "John Doe",
  "summary": "Item summary. May be multiline, but usually not.",
  "categories": ["work", "personal"],
  "length": 374,
  "rating": 7.2,
  "dueDate": "2017-01-31T00:00:00+00:00",
  "rank": 6.52593,
  "expectedRank": 6
}
```

## Development

If you want to make changes to the software, the following npm scripts are available:

```
npm run clean  # deletes the build folder
npm run lint   # checks the code for errors
npm run build  # compiles the source code and saves it into the "build" folder
npm test       # runs the test suite
```
