'use strict';

const { BaseFormatter } = require('./base-formatter');

class GeminiFormatter extends BaseFormatter {
  constructor() {
    super('gemini', 'GEMINI.md', 'gemini.hbs', { maxLines: 300 });
  }
}

module.exports = { GeminiFormatter };
