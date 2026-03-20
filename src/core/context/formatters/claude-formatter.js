'use strict';

const { BaseFormatter } = require('./base-formatter');

class ClaudeFormatter extends BaseFormatter {
  constructor() {
    super('claude', 'CLAUDE.md', 'claude.hbs', { maxLines: 200 });
  }
}

module.exports = { ClaudeFormatter };
