'use strict';
fdescribe('rankItems() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  let db, rankItems, testItems, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ rankItems } = module(db));
    //   testItems = db.data.items;
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

  describe('when successful', () => {

    let response;

    beforeEach(done => {
      rankItems(req, res, next).then(() => {
        response = res.send.calls.mostRecent().args[0];
        done();
      });
    });

    it('should respond with task details', () => {
      expect(response).toBeTask();
    });

    it('should respond with a "success" status', () => {
      expect(response.status).toBe('success');
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

    it('should change the saved coefficients', () => {
      //
    });

    it('should update the rank for all items', () => {
      //
    });

  });

});
