/* c8 ignore start */
import knex from 'knex'

// Credentials that integrations keep up to date themselves (e.g. rotating OAuth refresh tokens).
// The tokens are encrypted with ENCRYPTION_KEY.
const upSql = `CREATE TABLE IF NOT EXISTS integration_tokens
(
  integration_id character varying(32) NOT NULL,
  refresh_token text,
  access_token text,
  access_token_expires_at timestamp with time zone,
  seed_hash character varying(64),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT integration_tokens_pkey PRIMARY KEY (integration_id)
);`

const downSql = 'DROP TABLE integration_tokens;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
