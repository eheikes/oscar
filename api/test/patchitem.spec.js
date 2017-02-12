'use strict';
describe('patchItem() handler', () => {

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

  const testItem = {
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

  let db, patchItem, req, reqBody, res, next;

  beforeEach(done => {
    db = createDatabase();
    ({ patchItem } = module(db));
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
    reqBody = { expectedRank: 9 };
    req = createRequest(
      { itemId: testItem.id, typeId: testType.id },
      reqBody
    );
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the item exists', () => {

    describe('when "expectedRank" is patched', () => {

      beforeEach(done => {
        patchItem(req, res, next).then(done);
      });

      it('should respond with the field changed', () => {
        let response = res.send.calls.mostRecent().args[0];
        expect(response.expectedRank).toBe(reqBody.expectedRank);
      });

      it('should continue to the next middleware', () => {
        expect(next).toHaveBeenCalled();
      });

    });

    describe('when an unallowed field is patched', () => {

      beforeEach(done => {
        req = createRequest(
          { itemId: testItem.id, typeId: testType.id },
          { rank: 9 }
        );
        patchItem(req, res, next).then(done);
      });

      it('should respond with a 400 error', () => {
        expect(res).toSendError(400); // eslint-disable-line no-magic-numbers
      });

      it('should continue to the next middleware', () => {
        expect(next).toHaveBeenCalled();
      });

    });

    describe('when no fields are patched', () => {

      beforeEach(done => {
        req = createRequest(
          { itemId: testItem.id, typeId: testType.id },
          {}
        );
        patchItem(req, res, next).then(done);
      });

      it('should respond with a 400 error', () => {
        expect(res).toSendError(400); // eslint-disable-line no-magic-numbers
      });

      it('should continue to the next middleware', () => {
        expect(next).toHaveBeenCalled();
      });

    });

  });

  describe('when the item does not exist', () => {

    beforeEach(done => {
      req = createRequest(
        { itemId: 'nonexistent', typeId: testType.id },
        reqBody
      );
      patchItem(req, res, next).then(done);
    });

    it('should respond with a 404 error', () => {
      expect(res).toSendError(404); // eslint-disable-line no-magic-numbers
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
