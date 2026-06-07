/* c8 ignore start */
import knex from 'knex'

const upSql = `
BEGIN;

ALTER TABLE item_labels
DROP CONSTRAINT item_labels_item_id_fkey;

ALTER TABLE item_labels
ADD CONSTRAINT item_labels_item_id_fkey
FOREIGN KEY (item_id) REFERENCES public.items (id) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE CASCADE;

ALTER TABLE item_labels
DROP CONSTRAINT item_labels_label_id_fkey;

ALTER TABLE item_labels
ADD CONSTRAINT item_labels_label_id_fkey
FOREIGN KEY (label_id) REFERENCES public.labels (id) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE CASCADE;

COMMIT;
`

const downSql = `
BEGIN;

ALTER TABLE item_labels
DROP CONSTRAINT item_labels_item_id_fkey;

ALTER TABLE item_labels
ADD CONSTRAINT item_labels_item_id_fkey
FOREIGN KEY (item_id) REFERENCES public.items (id) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE item_labels
DROP CONSTRAINT item_labels_label_id_fkey;

ALTER TABLE item_labels
ADD CONSTRAINT item_labels_label_id_fkey
FOREIGN KEY (label_id) REFERENCES public.labels (id) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE NO ACTION;

COMMIT;
`

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
