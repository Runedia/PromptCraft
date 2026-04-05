import { BaseFormatter } from './base-formatter.js';

class CursorrulesFormatter extends BaseFormatter {
  constructor() {
    super('cursorrules', '.cursorrules', 'cursorrules.hbs', { maxLines: 150 });
  }
}

export { CursorrulesFormatter };
