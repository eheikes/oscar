'use strict';
describe('database', () => {

  const { createDatabase, deleteDatabase } = require('./helpers');

  let db;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
    }).then(done);
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  it('should create the models', () => {
    expect(db.collectors).toBeDefined();
    expect(db.collectorLogs).toBeDefined();
    expect(db.items).toBeDefined();
    expect(db.types).toBeDefined();
  });

});
