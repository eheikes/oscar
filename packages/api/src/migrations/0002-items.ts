/* c8 ignore start */
import knex from 'knex'

const upSql = `CREATE TABLE IF NOT EXISTS items
(
  id uuid NOT NULL,
  uri character varying(2048) NOT NULL,
  title character varying(256) NOT NULL,
  author character varying(256),
  summary text,
  language character varying(16),
  image_uri character varying(2048),
  length double precision,
  rating numeric(5,2) DEFAULT NULL::numeric,
  due date,
  rank numeric(3,1) DEFAULT NULL::numeric,
  expected_rank numeric(3,1) DEFAULT NULL::numeric,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  deleted_at timestamp with time zone,
  type_id character varying(16) NOT NULL,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_type_id_fkey FOREIGN KEY (type_id)
      REFERENCES public.types (id) MATCH SIMPLE
      ON UPDATE NO ACTION
      ON DELETE NO ACTION
);`

const downSql = 'DROP TABLE items;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
