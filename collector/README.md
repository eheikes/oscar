# OSCAR Collector

This project contains the collector agent for the OSCAR assistant.

## Requirements

* [Node.js](https://nodejs.org/) 8.0 or higher
* A MySQL, MariaDB, PostgreSQL, or SQLite 3 database engine

## Installation

Run `npm install -g oscar-assistant-collector DATABASE-DRIVER`, where `DATABASE-DRIVER` is replaced with the database you will be using:

* `mariasql` for MariaDB
* `mysql` or `mysql2` for MySQL
* `pg` for PostgreSQL
* `sqlite3` for SQLite

## Usage

Example that pulls from 5 sources, using `config.yaml` for the configuration:

```
oscar-collector -c 5 config.yaml
```

Run `oscar-collector --help` to see the full list of options.
