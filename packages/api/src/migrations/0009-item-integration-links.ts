/* c8 ignore start */
import knex from 'knex'

// Links items to the things they were sent to in other services (e.g. Skylight chores).
const upSql = `CREATE TABLE IF NOT EXISTS item_integration_links
(
  item_id uuid NOT NULL,
  integration_id character varying(32) NOT NULL,
  external_id character varying(256) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT item_integration_links_pkey PRIMARY KEY (item_id, integration_id, external_id),
  CONSTRAINT item_integration_links_item_id_fkey FOREIGN KEY (item_id)
    REFERENCES public.items (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);`

const downSql = 'DROP TABLE item_integration_links;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
