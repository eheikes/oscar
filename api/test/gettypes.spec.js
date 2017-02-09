'use strict';
describe('getTypes() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  const testTypes = [{
    id: 'type1',
    readable: 'Type 1'
  }, {
    id: 'type2',
    readable: 'Type 2'
  }];

  let db, getTypes, req, res, next;

  beforeEach(done => {
    db = createDatabase();
    ({ getTypes } = module(db));
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
      getTypes(req, res, next).then(done);
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
      db.types.bulkCreate(testTypes).then(instances => {
        return getTypes(req, res, next);
      }).then(done);
    });

    it('should respond with all the types', () => {
      expect(res).toSendData(testTypes);
    });

    it('should match the type schema', () => {
      let types = res.send.calls.mostRecent().args[0];
      expect(types[0]).toBeType();
      expect(types[1]).toBeType();
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
