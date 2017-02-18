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

  let db, patchItem, testItem, testType, req, reqBody, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ patchItem } = module(db));
      testType = db.data.types[0];
      testItem = db.data.items[0];
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

      it('should match the item schema', () => {
        let response = res.send.calls.mostRecent().args[0];
        expect(response).toBeItem();
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
