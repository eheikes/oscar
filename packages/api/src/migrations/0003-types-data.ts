/* c8 ignore start */
import knex from 'knex'

const upSql = `INSERT INTO types (id, readable) VALUES
('listen', 'listen to'),
('listen-passive', 'passively listen to'),
('news', 'catch up on'),
('play', NULL),
('read', NULL),
('task', 'do'),
('watch', NULL),
('watch-passive', 'passively watch')
ON CONFLICT (id) DO NOTHING;
`

const downSql = 'DELETE * FROM types;'

export const up = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(upSql)
export const down = (knex: knex.Knex): knex.Knex.SchemaBuilder => knex.schema.raw(downSql)
