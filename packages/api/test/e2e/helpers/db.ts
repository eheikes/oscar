import { getDatabaseConnection } from '../../../src/database.js'

// Simulates a database failure partway through a write, by making inserts of the given label fail.
export const failLabelInserts = async (labelId: string): Promise<void> => {
  const db = getDatabaseConnection()
  await db.raw(`
    CREATE OR REPLACE FUNCTION test_fail_label_insert() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'Simulated failure';
    END
    $$ LANGUAGE plpgsql
  `)
  // DDL can't use bound parameters, so only allow simple label IDs.
  if (!/^[a-z-]+$/.test(labelId)) {
    throw new Error(`Unsupported label ID: ${labelId}`)
  }
  await db.raw(`
    CREATE TRIGGER test_fail_label_insert BEFORE INSERT ON item_labels
    FOR EACH ROW WHEN (NEW.label_id = '${labelId}') EXECUTE FUNCTION test_fail_label_insert()
  `)
}

export const restoreLabelInserts = async (): Promise<void> => {
  const db = getDatabaseConnection()
  await db.raw('DROP TRIGGER IF EXISTS test_fail_label_insert ON item_labels')
  await db.raw('DROP FUNCTION IF EXISTS test_fail_label_insert')
}
