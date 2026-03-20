'use strict';

const { CONTEXT_FORMATS } = require('../../shared/constants');
const { generate, preview, write, generateAll, generateWithValidation } = require('./generator');
const { buildCanonicalContext, validateCanonicalContext } = require('./canonical-model');
const { getFormatter, getRegisteredFormats, registerFormatter } = require('./formatter-registry');
const { validateContext } = require('./validator');
const { detectSecrets, filterSecrets } = require('./secret-filter');

module.exports = {
  CONTEXT_FORMATS,
  generate, preview, write, generateAll, generateWithValidation,
  buildCanonicalContext, validateCanonicalContext,
  getFormatter, getRegisteredFormats, registerFormatter,
  validateContext,
  detectSecrets, filterSecrets,
};
