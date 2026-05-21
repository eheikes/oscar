/* c8 ignore start */
import knex from 'knex'

const upSql = `CREATE TABLE IF NOT EXISTS item_labels
(
  item_id uuid NOT NULL,
  label_id character varying(16) NOT NULL,
  CONSTRAINT item_labels_pkey PRIMARY KEY (item_id, label_id),
  CONSTRAINT item_labels_item_id_fkey FOREIGN KEY (item_id)
    REFERENCES public.items (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT item_labels_label_id_fkey FOREIGN KEY (label_id)
    REFERENCES public.labels (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);`

const downSql = 'DROP TABLE item_labels;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
