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

  const testTypes = [{
    id: 'type1',
    readable: 'Type 1'
  }, {
    id: 'type2',
    readable: 'Type 2'
  }];

  const matchingTypeId = 'type1';

  let db, getItems, types, testItems, req, res, next;

  beforeEach(done => {
    db = createDatabase();
    ({ getItems } = module(db));
    types = [];
    // TODO this is horrible
    db.ready.then(() => {
      return db.types.bulkCreate(testTypes);
    }).then(() => {
      return db.types.findById(testTypes[0].id);
    }).then(instance => {
      types[instance.id] = instance;
      return db.types.findById(testTypes[1].id);
    }).then(instance => {
      types[instance.id] = instance;
      testItems = [{
        id: 1,
        url: 'http://example.com/1',
        title: 'Example Site',
        author: null,
        summary: null,
        length: null,
        rating: null,
        due: null,
        rank: null,
        expectedRank: null,
        createdAt: '2017-01-01T00:00:00.000Z',
        updatedAt: '2017-01-01T00:00:00.000Z',
        deletedAt: null,
        type_id: testTypes[0].id // eslint-disable-line camelcase
      }, {
        id: 2,
        url: 'http://example.com/2',
        title: 'Example Site',
        author: null,
        summary: null,
        length: null,
        rating: null,
        due: null,
        rank: null,
        expectedRank: null,
        createdAt: '2017-01-02T00:00:00.000Z',
        updatedAt: '2017-01-02T00:00:00.000Z',
        deletedAt: null,
        type_id: testTypes[1].id // eslint-disable-line camelcase
      }, {
        id: 3,
        url: 'http://example.com/3',
        title: 'Example Site',
        author: null,
        summary: null,
        length: null,
        rating: null,
        due: null,
        rank: null,
        expectedRank: null,
        createdAt: '2017-01-03T00:00:00.000Z',
        updatedAt: '2017-01-03T00:00:00.000Z',
        deletedAt: null,
        type_id: testTypes[0].id // eslint-disable-line camelcase
      }];
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest({ typeId: matchingTypeId });
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the database is empty', () => {

    beforeEach(done => {
      getItems(req, res, next).then(done);
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
      db.items.bulkCreate(testItems).then(() => {
        return db.items.findAll();
      }).then(instances => {
        return Promise.all([
          instances[0].setType('type1'),
          instances[1].setType('type2'),
          instances[2].setType('type1'),
        ]);
      }).then(instances => {
        return getItems(req, res, next);
      }).then(done);
    });

    it('should respond with the items matching the type ID', () => {
      let expected = [
        testItems[0],
        testItems[2]
      ];
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
          testItems[0]
        ];
        expect(res).toSendData(expected);
      }).then(done);
    });

  });

});
