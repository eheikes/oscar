'use strict';
describe('getItems() handler', () => {

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


  let db, getItems, types, testItems, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ getItems } = module(db));
      testItems = db.data.items;
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest({ typeId: 'type1' });
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the database is empty', () => {

    beforeEach(done => {
      db.items.destroy({ where: {} }).then(() => {
        return getItems(req, res, next);
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
      getItems(req, res, next).then(done);
    });

    it('should respond with the items matching the type ID', () => {
      let expected = [
        testItems[2],
        testItems[0],
        testItems[3]
      ].map(formatItem);
      expect(res).toSendData(expected);
    });

    it('should match the item schema', () => {
      let items = res.send.calls.mostRecent().args[0];
      expect(items[0]).toBeItem();
      expect(items[1]).toBeItem();
      expect(items[2]).toBeItem();
    });

    it('should sort the items by rank descending', () => {
      let expected = [
        testItems[2],
        testItems[0],
        testItems[3]
      ].map(formatItem);
      expect(res).toSendData(expected);
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

    it('should exclude deleted items', done => {
      db.items.destroy({
        where: { id: testItems[2].id }
      }).then(() => {
        return getItems(req, res, next); // request again
      }).then(() => {
        let expected = [
          testItems[0],
          testItems[3]
        ].map(formatItem);
        expect(res).toSendData(expected);
      }).then(done);
    });

    it('should accept a "start" param', done => {
      req = createRequest({ typeId: 'type1', start: 1 });
      getItems(req, res, next).then(() => {
        let expected = [
          testItems[0],
          testItems[3]
        ].map(formatItem);
        expect(res).toSendData(expected);
      }).then(done);
    });

    it('should accept a "limit" param', done => {
      req = createRequest({ typeId: 'type1', limit: 2 });
      getItems(req, res, next).then(() => {
        let expected = [
          testItems[2],
          testItems[0]
        ].map(formatItem);
        expect(res).toSendData(expected);
      }).then(done);
    });

  });

});
