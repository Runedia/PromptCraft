'use strict';

const { initialize, getConnection, closeConnection } = require('./connection');
const history = require('./repositories/history');
const template = require('./repositories/template');
const config = require('./repositories/config');

module.exports = {
  initialize,
  getConnection,
  closeConnection,
  history,
  template,
  config,
};
