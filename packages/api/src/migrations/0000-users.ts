/* c8 ignore start */
import knex from 'knex'

const upSql = `CREATE TABLE IF NOT EXISTS users
(
  id character varying(256) NOT NULL,
  name character varying(256) DEFAULT NULL::character varying,
  nickname character varying(256) DEFAULT NULL::character varying,
  email character varying(256) DEFAULT NULL::character varying,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);`

const downSql = 'DROP TABLE users;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
