import { BaseFormatter } from './base-formatter.js';

class ClaudeFormatter extends BaseFormatter {
  constructor() {
    super('claude', 'CLAUDE.md', 'claude.hbs', { maxLines: 200 });
  }
}

export { ClaudeFormatter };
