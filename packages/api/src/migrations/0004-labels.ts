/* c8 ignore start */
import knex from 'knex'

const upSql = `CREATE TABLE IF NOT EXISTS labels
(
  id character varying(16) NOT NULL,
  readable character varying(256) DEFAULT NULL::character varying,
  CONSTRAINT labels_pkey PRIMARY KEY (id)
);`

const downSql = 'DROP TABLE labels;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
