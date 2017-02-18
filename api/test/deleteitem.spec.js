'use strict';
describe('deleteItem() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  let db, deleteItem, testType, testItem, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ deleteItem } = module(db));
      testType = db.data.types[0];
      testItem = db.data.items[0];
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest({ itemId: testItem.id, typeId: testType.id });
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the item exists', () => {

    beforeEach(done => {
      deleteItem(req, res, next).then(done);
    });

    it('should respond with the deleted field changed', () => {
      let response = res.send.calls.mostRecent().args[0];
      expect(response.deletedAt).not.toBeNull();
    });

    it('should match the item schema', () => {
      let response = res.send.calls.mostRecent().args[0];
      expect(response).toBeItem();
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

  describe('when the item does not exist', () => {

    beforeEach(done => {
      req = createRequest({ itemId: 'nonexistent', typeId: testType.id });
      deleteItem(req, res, next).then(done);
    });

    it('should respond with a 404 error', () => {
      expect(res).toSendError(404); // eslint-disable-line no-magic-numbers
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
