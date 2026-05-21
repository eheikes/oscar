/* c8 ignore start */
import knex from 'knex'

const upSql = `INSERT INTO labels (id, readable) VALUES
('work', NULL),
('personal', NULL),
('busywork', NULL),
('important', NULL),
('trivial', NULL),
('urgent', NULL)
ON CONFLICT (id) DO NOTHING;
`

const downSql = 'DELETE * FROM labels;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
