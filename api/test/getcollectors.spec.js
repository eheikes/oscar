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

  const testCollectors = [{
    id: 'collector1',
    name: 'Example Collector'
  }, {
    id: 'collector2',
    name: 'Example Collector 2'
  }];

  let db, getCollectors, req, res, next;

  beforeEach(done => {
    db = createDatabase();
    ({ getCollectors } = module(db));
    db.ready.then(done);
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
      getCollectors(req, res, next).then(done);
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
      db.collectors.bulkCreate(testCollectors).then(() => {
        return getCollectors(req, res, next);
      }).then(done);
    });

    it('should respond with all the items', () => {
      expect(res).toSendData(testCollectors);
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
