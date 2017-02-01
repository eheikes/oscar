'use strict';
describe('getCollector() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  const testCollector = {
    id: 'collector1',
    name: 'Example Collector'
  };

  let db, getCollector, req, res, next;

  beforeEach(done => {
    db = createDatabase();
    ({ getCollector } = module(db));
    db.ready.then(() => {
      return db.collectors.create(testCollector);
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest({ collectorId: testCollector.id });
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the item exists', () => {

    beforeEach(done => {
      getCollector(req, res, next).then(done);
    });

    it('should respond with the item', () => {
      expect(res).toSendData(testCollector);
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

  describe('when the item does not exist', () => {

    beforeEach(done => {
      req = createRequest({ collectorId: 'nonexistent' });
      getCollector(req, res, next).then(done);
    });

    it('should respond with a 404 error', () => {
      expect(res).toSendError(404); // eslint-disable-line no-magic-numbers
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
