'use strict';

const { BaseFormatter } = require('./base-formatter');

class CursorrulesFormatter extends BaseFormatter {
  constructor() {
    super('cursorrules', '.cursorrules', 'cursorrules.hbs', { maxLines: 150 });
  }
}

module.exports = { CursorrulesFormatter };
