'use strict';

const Database = require('../build/database').Database;
const fs = require('fs');
const tempfile = require('tempfile');
const types = require('typology');

const numberOrNullType = val => {
  return val === null || typeof val === 'number';
};

const stringOrNullType = val => {
  return val === null || typeof val === 'string';
};

const timestampType = val => {
  return typeof val === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([-+]\d{2}:\d{2}))$/.test(val);
};

const timestampOrNullType = val => {
  return val === null || timestampType(val);
};

// Checks if the given object has the expected properties,
//   and no others.
let checkProperties = (actual, expected) => {
  let result = types.scan(expected, actual);
  let props = result.path ? `${result.path.join(', ')}: ` : '';
  return result.error ?
    [`${props}${result.error}`] :
    [];
};

// Jasmine matcher to check if the passed object
//   matches the collector schema.
let toBeCollector = (util, customEqualityTesters) => {
  return {
    compare: (actual) => {
      let errors = checkProperties(actual, {
        id: 'string',
        name: 'string',
        numErrors: 'number'
      });
      let result = {
        pass: errors.length === 0,
        message: errors.join(' ')
      };
      return result;
    }
  };
};

// Jasmine matcher to check if the passed object
//   matches the collector log schema.
let toBeCollectorLog = (util, customEqualityTesters) => {
  return {
    compare: (actual) => {
      let errors = checkProperties(actual, {
        id: 'number',
        timestamp: timestampType,
        log: 'string',
        numErrors: 'number'
      });
      let result = {
        pass: errors.length === 0,
        message: errors.join(' ')
      };
      return result;
    }
  };
};

// Jasmine matcher to check if the passed object
//   matches the type schema.
let toBeItem = (util, customEqualityTesters) => {
  return {
    compare: (actual) => {
      let errors = checkProperties(actual, {
        id: 'number',
        added: timestampType,
        deleted: timestampOrNullType,
        url: 'string',
        title: 'string',
        author: stringOrNullType,
        summary: stringOrNullType,
        categories: ['string'],
        length: numberOrNullType,
        rating: numberOrNullType,
        due: timestampOrNullType,
        rank: 'number',
        expectedRank: numberOrNullType
      });
      let result = {
        pass: errors.length === 0,
        message: errors.join(' ')
      };
      return result;
    }
  };
};

// Jasmine matcher to check if the passed object
//   matches the type schema.
let toBeType = (util, customEqualityTesters) => {
  return {
    compare: (actual) => {
      let errors = checkProperties(actual, {
        id: 'string',
        readable: 'string'
      });
      let result = {
        pass: errors.length === 0,
        message: errors.join(' ')
      };
      return result;
    }
  };
};

// Jasmine matcher to check if the passed response object
//   invoked send() with the expected JSON data.
let toSendData = (util, customEqualityTesters) => {
  return {
    compare: (actual, expected) => {
      let result;
      if (expected) {
        // Jasmine's util.equals() doesn't work, so JSON.stringify() the values.
        let response = JSON.stringify(actual.send.calls.mostRecent().args[0]);
        expected = JSON.stringify(expected);
        result = { pass: response === expected };
        result.message = 'Expected send() spy ';
        if (result.pass) {
          result.message += `to not send data ${expected}.`;
        } else {
          result.message += `to send data ${expected}, but it sent ${response}.`;
        }
      } else {
        result = { pass: actual.send.calls.any() };
        result.message = 'Expected send() spy ';
        if (result.pass) {
          result.message += 'to not send data.';
        } else {
          result.message += 'to send data, but it did.';
        }
      }
      return result;
    }
  };
};

// Jasmine matcher to check if the passed response object
//   invoked send() with the expected error.
let toSendError = (util, customEqualityTesters) => {
  return {
    compare: (actual, expected) => {
      let error = actual.send.calls.mostRecent().args[0];
      let result = { pass: error.statusCode === expected };
      result.message = 'Expected send() spy ';
      if (result.pass) {
        result.message += `to not send error of ${expected}.`;
      } else {
        result.message += `to send error of ${expected}, but it sent ${error.statusCode}.`;
      }
      return result;
    }
  };
};

// Creates and populates the database.
exports.createDatabase = () => {
  let collectors = require('./fixture/collectors.json');
  let collectorLogs = require('./fixture/collectorlogs.json');
  let items = require('./fixture/items.json');
  let types = require('./fixture/types.json');

  // Create the database and save the configuration.
  let config = {
    type: 'sqlite',
    name: 'db',
    user: 'user',
    password: 'pass',
    storage: tempfile('.sqlite'),
    logging: function() {}
  };
  let db = new Database(config);
  db.config = config;

  // Save the original data.
  db.data = { collectors, collectorLogs, items, types };
  db.data.collectors.forEach((collector, i) => {
    // Calculate the numErrors for each collector.
    db.data.collectors[i].numErrors = db.data.collectorLogs.reduce((soFar, log) => {
      if (log.collector_id === collector.id) { soFar += log.numErrors; }
      return soFar;
    }, 0);
  });

  // Populate the database with the data.
  return db.ready.then(() => {
    return Promise.all([
      db.collectors.bulkCreate(collectors),
      db.collectorLogs.bulkCreate(collectorLogs),
      db.items.bulkCreate(items),
      db.types.bulkCreate(types)
    ]);
  }).then(() => {
    return db;
  });
};

exports.createNextStub = () => {
  return jasmine.createSpy('next');
};

exports.createRequest = (params, body = null) => {
  params = params || {};
  return { body, params };
};

exports.createResponseStub = () => {
  return jasmine.createSpyObj('res', ['send', 'status']);
};

exports.customMatchers = {
  toBeCollector,
  toBeCollectorLog,
  toBeItem,
  toBeType,
  toSendData,
  toSendError
};

exports.deleteDatabase = filename => {
  fs.unlinkSync(filename);
};
