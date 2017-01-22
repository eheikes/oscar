'use strict';

const Database = require('../build/database');
const fs = require('fs');
const tempfile = require('tempfile');

// Jasmine matcher to check if the passed response object
//   invoked send() with the expected JSON data.
let toSendData = (util, customEqualityTesters) => {
  return {
    compare: (actual, expected) => {
      // Jasmine's util.equals() doesn't work, so JSON.stringify() the values.
      let response = JSON.stringify(actual.send.calls.mostRecent().args[0]);
      expected = JSON.stringify(expected);
      let result = { pass: response === expected };
      result.message = 'Expected send() spy ';
      if (result.pass) {
        result.message += `to not send data ${expected}.`;
      } else {
        result.message += `to send data ${expected}, but it sent ${response}.`;
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
  return jasmine.createSpyObj('res', ['send']);
};

exports.customMatchers = {
  toSendData: toSendData
};

exports.deleteDatabase = filename => {
  fs.unlinkSync(filename);
};
