'use strict';
describe('getItem() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  const formatItem = item => {
    return Object.assign(
      {},
      item,
      {
        added: item.createdAt,
        categories: item.categories.length === 0 ?
          [] :
          item.categories.split(','),
        createdAt: undefined,
        deleted: item.deletedAt,
        deletedAt: undefined,
        type_id: undefined,
        updatedAt: undefined
      }
    );
  };

  let db, getItem, testItem, testType, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ getItem } = module(db));
      testItem = db.data.items[0];
      testType = db.data.types[0];
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
      getItem(req, res, next).then(done);
    });

    it('should respond with the item', () => {
      expect(res).toSendData(formatItem(testItem));
    });

    it('should match the item schema', () => {
      let item = res.send.calls.mostRecent().args[0];
      expect(item).toBeItem();
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

  describe('when the item does not exist', () => {

    beforeEach(done => {
      req = createRequest({ itemId: 'nonexistent', typeId: testType.id });
      getItem(req, res, next).then(done);
    });

    it('should respond with a 404 error', () => {
      expect(res).toSendError(404); // eslint-disable-line no-magic-numbers
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
