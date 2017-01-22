'use strict';
describe('database', () => {

  const { createDatabase, deleteDatabase } = require('./helpers');

  let db;

  beforeAll(done => {
    db = createDatabase();
    db.ready.then(done);
  });

  afterAll(() => {
    deleteDatabase(db.config.storage);
  });

  it('should create the models', () => {
    expect(db.collectors).toBeDefined();
    expect(db.collectorLogs).toBeDefined();
    expect(db.items).toBeDefined();
    expect(db.types).toBeDefined();
  });

});
