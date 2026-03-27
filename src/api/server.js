'use strict';

const express = require('express');
const cors = require('cors');
const db = require('../core/db');

const scanRouter = require('./routes/scan');
const qnaRouter = require('./routes/qna');
const promptRouter = require('./routes/prompt');
const historyRouter = require('./routes/history');
const templateRouter = require('./routes/template');
const configRouter = require('./routes/config');
const treesRouter = require('./routes/trees');
const filesRouter = require('./routes/files');
const { errorHandler } = require('./middleware/error-handler');

function createApp() {
  // Ensure DB is initialized before handling requests
  db.initialize();

  const app = express();

  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.use('/api/scan', scanRouter);
  app.use('/api/qna', qnaRouter);
  app.use('/api/prompt', promptRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/templates', templateRouter);
  app.use('/api/config', configRouter);
  app.use('/api/trees', treesRouter);
  app.use('/api/files', filesRouter);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
