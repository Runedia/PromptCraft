'use strict';

const { AppError } = require('../../shared/errors');

const ERROR_STATUS_MAP = {
  'VALIDATION_ERROR': 400,
  'NOT_FOUND': 404,
  'SESSION_NOT_FOUND': 404,
  'TREE_NOT_FOUND': 404,
  'QNA_ERROR': 400,
  'SCAN_ERROR': 422,
  'BUILD_ERROR': 500,
  'DB_ERROR': 500,
};

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const status = ERROR_STATUS_MAP[err.code] || 500;
    return res.status(status).json({ error: err.message, code: err.code });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
