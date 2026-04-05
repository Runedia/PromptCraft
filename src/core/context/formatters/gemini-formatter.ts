import { BaseFormatter } from './base-formatter.js';

class GeminiFormatter extends BaseFormatter {
  constructor() {
    super('gemini', 'GEMINI.md', 'gemini.hbs', { maxLines: 300 });
  }
}

export { GeminiFormatter };
