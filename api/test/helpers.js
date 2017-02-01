'use strict';

const Database = require('../build/database');
const fs = require('fs');
const tempfile = require('tempfile');

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

exports.createRequest = params => {
  params = params || {};
  return { params: params };
};

exports.createResponseStub = () => {
  return jasmine.createSpyObj('res', ['send', 'status']);
};

exports.customMatchers = { toSendData, toSendError };

exports.deleteDatabase = filename => {
  fs.unlinkSync(filename);
};
