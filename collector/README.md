# OSCAR Collector

This project contains the collector agent for the OSCAR assistant.

## Requirements

* [Node.js](https://nodejs.org/) 8.0 or higher
* A MySQL, MariaDB, PostgreSQL, or SQLite 3 database engine

## Installation

Run `npm install -g oscar-assistant-collector`.

## Usage

Example that pulls from 5 sources, using `config.yaml` for the configuration:

```
oscar-collector -c 5 config.yaml
```

Run `oscar-collector --help` to see the full list of options.
