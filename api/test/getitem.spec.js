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

  const testType = {
    id: 'type1',
    readable: 'Type 1'
  };

  const formatItem = item => {
    item.added = item.createdAt;
    item.categories = item.categories.length === 0 ?
      [] :
      item.categories.split(',');
    item.deleted = item.deletedAt;
    delete item.createdAt;
    delete item.deletedAt;
    delete item.type_id;
    delete item.updatedAt;
    return item;
  }

  let db, getItem, testItem, req, res, next;

  beforeEach(done => {
    testItem = {
      id: 1,
      url: 'http://example.com',
      title: 'Example Item',
      author: 'John Doe',
      summary: 'Summary',
      length: 42,
      rating: 5.6,
      due: '2017-10-11T00:00:00.000Z',
      rank: 6.7,
      expectedRank: 7.1,
      categories: '',
      createdAt: '2017-01-01T00:00:00.000Z',
      updatedAt: '2017-01-01T00:00:00.000Z',
      deletedAt: null
    };
    db = createDatabase();
    ({ getItem } = module(db));
    // TODO this is horrible
    db.ready.then(() => {
      return db.types.create(testType);
    }).then(type => {
      testItem.type_id = type.id; // eslint-disable-line camelcase
      return db.items.create(testItem);
    }).then(item => {
      testItem.updatedAt = item.updatedAt;
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
