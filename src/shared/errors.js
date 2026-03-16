'use strict';

class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ScanError extends AppError {
  constructor(message) {
    super(message, 'SCAN_ERROR');
  }
}

class QnAError extends AppError {
  constructor(message) {
    super(message, 'QNA_ERROR');
  }
}

class BuildError extends AppError {
  constructor(message) {
    super(message, 'BUILD_ERROR');
  }
}

class DBError extends AppError {
  constructor(message) {
    super(message, 'DB_ERROR');
  }
}

class ContextError extends AppError {
  constructor(message) {
    super(message, 'CONTEXT_ERROR');
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
  }
}

module.exports = {
  AppError,
  ScanError,
  QnAError,
  BuildError,
  DBError,
  ContextError,
  ValidationError,
};
