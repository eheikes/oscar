'use strict';
describe('getCollectorLogs() handler', () => {

  const module = require('../build/handlers');
  const {
    createDatabase,
    createNextStub,
    createRequest,
    createResponseStub,
    customMatchers,
    deleteDatabase
  } = require('./helpers');

  const testCollectors = [{
    id: 'collector1',
    name: 'Example Collector'
  }, {
    id: 'collector2',
    name: 'Example Collector 2'
  }];

  const matchingCollectorId = 'collector1';

  let db, getCollectorLogs, collectors, testLogs, req, res, next;

  beforeEach(done => {
    db = createDatabase();
    ({ getCollectorLogs } = module(db));
    collectors = [];
    // TODO this is horrible
    db.ready.then(() => {
      return db.collectors.bulkCreate(testCollectors);
    }).then(() => {
      return db.collectors.findById(testCollectors[0].id);
    }).then(instance => {
      collectors[instance.id] = instance;
      return db.collectors.findById(testCollectors[1].id);
    }).then(instance => {
      collectors[instance.id] = instance;
      testLogs = [{
        id: 1,
        timestamp: '2017-01-01T00:00:00.000Z',
        log: 'Log output',
        numErrors: 0,
        collector_id: testCollectors[0].id // eslint-disable-line camelcase
      }, {
        id: 2,
        timestamp: '2017-01-02T00:00:00.000Z',
        log: 'Log output',
        numErrors: 0,
        collector_id: testCollectors[1].id // eslint-disable-line camelcase
      }, {
        id: 3,
        timestamp: '2017-01-03T00:00:00.000Z',
        log: 'Log output',
        numErrors: 5,
        collector_id: testCollectors[0].id // eslint-disable-line camelcase
      }];
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest({ collectorId: matchingCollectorId });
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the database is empty', () => {

    beforeEach(done => {
      getCollectorLogs(req, res, next).then(done);
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
      db.collectorLogs.bulkCreate(testLogs).then(() => {
        return db.collectorLogs.findAll();
      }).then(instances => {
        return Promise.all([
          instances[0].setCollector('collector1'),
          instances[1].setCollector('collector2'),
          instances[2].setCollector('collector1'),
        ]);
      }).then(instances => {
        return getCollectorLogs(req, res, next);
      }).then(done);
    });

    it('should respond with the items matching the collector ID', () => {
      let expected = [
        testLogs[2],
        testLogs[0]
      ];
      expect(res).toSendData(expected);
    });

    it('should respond with the items in chronological descending order', () => {
      let expected = [
        testLogs[2],
        testLogs[0]
      ];
      expect(res).toSendData(expected);
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

});
