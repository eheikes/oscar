'use strict';
describe('getCollectors() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  let db, getCollectors, testCollectors, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ getCollectors } = module(db));
      testCollectors = db.data.collectors;
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest();
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the database is empty', () => {

    beforeEach(done => {
      db.collectors.destroy({ where: {} }).then(() => {
        return getCollectors(req, res, next);
      }).then(done);
    });

    it('should respond with an empty array', () => {
      expect(res).toSendData([]);
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

  describe('when the database is populated', () => {

    beforeEach(done => {
      getCollectors(req, res, next).then(done);
    });

    it('should respond with all the items', () => {
      expect(res).toSendData(testCollectors);
    });

    it('should match the collector schema', () => {
      let collectors = res.send.calls.mostRecent().args[0];
      expect(collectors[0]).toBeCollector();
      expect(collectors[1]).toBeCollector();
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
