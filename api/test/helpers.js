'use strict';

const Database = require('../build/database');
const fs = require('fs');
const tempfile = require('tempfile');

const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([-+]\d{2}:\d{2}))$/;

// Checks if the given object has the expected properties,
//   and no others.
let checkProperties = (actual, expected) => {
  let errors = [];
  let notInExpected = prop => { return !Object.keys(expected).includes(prop); };
  for (let prop in expected) {
    if (expected.hasOwnProperty(prop)) {
      if (typeof actual[prop] === 'undefined') {
        errors.push(`The "${prop}" field is missing.`);
      } else if (expected[prop] === 'timestamp') {
        if (typeof actual[prop] !== 'string') {
          errors.push(`The "${prop}" field is not a string.`);
        }
        if (!iso8601.test(actual[prop])) {
          errors.push(`The "${prop}" field is not an ISO 8601 datetime.`);
        }
      } else if (typeof actual[prop] !== expected[prop]) {
        errors.push(
          `The "${prop}" field should have type of ${expected[prop]}, but it is ${typeof actual[prop]}.`
        );
      }
    }
  }
  errors = errors.concat(Object.keys(actual).filter(notInExpected).map(prop => {
    return `The "${prop}" field should not be included.`;
  }));
  return errors;
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
        timestamp: 'timestamp',
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

exports.createDatabase = () => {
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
  return db;
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
  toBeType,
  toSendData,
  toSendError
};

exports.deleteDatabase = filename => {
  fs.unlinkSync(filename);
};
