# OSCAR API Server

This project contains the API server for the OSCAR assistant. It is written for AWS Lambda and RDS.

## Requirements

* [Node.js](https://nodejs.org/) 8.0 or higher
* PostgreSQL database

## Installation & Usage

1. Download and unpack the software.
  * Download it by running `npm pack @eheikes/oscar-api`.
  * Unpack it using your favorite archiver (e.g. [7-Zip](https://www.7-zip.org) or `tar`).
2. Configure the software. Create a `.env` file in same folder with the following (replace with the appropriate values for your setup):

    ```
    DATABASE_HOST=127.0.0.1
    DATABASE_USER=username
    DATABASE_PASSWORD=password
    DATABASE_NAME=db_name
    ```

3. Run `npm start` to start the server.

## API Reference

All endpoints receive and return JSON data (`application/json`).

Timestamps are in ISO 8601 format.

### `GET /types`

Returns all types.

### `GET /types/:typeId?start&limit&q&order`

Returns the collected items for the given type. Deleted items are excluded.

### `GET /types/:typeId/:itemId`

Return the item details.

## Development

If you want to make changes to the software, the following npm scripts are available:

```
yarn lint   # checks the code for errors
yarn build  # compiles the source code and saves it into the "dist" folder
yarn test   # runs the test suite
```
