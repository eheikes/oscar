/* c8 ignore start */
import knex from 'knex'

const upSql = `
BEGIN;

ALTER TABLE items
ADD COLUMN parent_id uuid DEFAULT NULL;

ALTER TABLE items
ADD CONSTRAINT items_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.items (id) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE NO ACTION;

COMMIT;
`

const downSql = `
BEGIN;

ALTER TABLE items
DROP CONSTRAINT items_parent_id_fkey;

ALTER TABLE items
DROP COLUMN parent_id;

COMMIT;
`

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
