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

  let db, getTypes, testTypes, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ getTypes } = module(db));
      testTypes = db.data.types;
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
      db.types.destroy({ where: {} }).then(() => {
        return getTypes(req, res, next);
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
      getTypes(req, res, next).then(done);
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
