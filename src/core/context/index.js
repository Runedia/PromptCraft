'use strict';

const { CONTEXT_FORMATS } = require('../../shared/constants');
const { generate, preview, write, generateAll } = require('./generator');

module.exports = { CONTEXT_FORMATS, generate, preview, write, generateAll };
