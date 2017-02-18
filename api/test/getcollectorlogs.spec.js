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

  let db, getCollectorLogs, testLogs, req, res, next;

  beforeEach(done => {
    createDatabase().then(dbInstance => {
      db = dbInstance;
      ({ getCollectorLogs } = module(db));
      testLogs = db.data.collectorLogs.map(log => {
        return Object.assign({}, log, { collector_id: undefined });
      });
    }).then(done);
  });

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);
    req = createRequest({ collectorId: 'collector1' });
    res = createResponseStub();
    next = createNextStub();
  });

  afterEach(() => {
    deleteDatabase(db.config.storage);
  });

  describe('when the database is empty', () => {

    beforeEach(done => {
      db.collectorLogs.destroy({ where: {} }).then(() => {
        return getCollectorLogs(req, res, next);
      }).then(done);
    });

    it('should respond with an empty array', () => {
      expect(res).toSendData([]);
    });

    it('should continue to the next middleware', () => {
      expect(next).toHaveBeenCalled();
    });

  });

  describe('when the database is populated', () => { // TODO

    beforeEach(done => {
      getCollectorLogs(req, res, next).then(done);
    });

    it('should respond with the items matching the collector ID', () => {
      let expected = [
        testLogs[2],
        testLogs[0]
      ];
      expect(res).toSendData(expected);
    });

    it('should match the collector schema', () => {
      let logs = res.send.calls.mostRecent().args[0];
      expect(logs[0]).toBeCollectorLog();
      expect(logs[1]).toBeCollectorLog();
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
