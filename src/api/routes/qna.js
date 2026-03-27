'use strict';

const express = require('express');
const router = express.Router();
const qna = require('../../core/qna');
const { startSessionCleaner } = require('../middleware/session-cleaner');

// Server-side session tracking (for TTL cleanup)
const sessionMeta = new Map(); // sessionId -> { lastAccessedAt, treeId }
startSessionCleaner(sessionMeta);

function touchSession(sessionId, treeId) {
  sessionMeta.set(sessionId, { lastAccessedAt: Date.now(), treeId });
}

// POST /api/qna/session
router.post('/session', (req, res, next) => {
  try {
    const { treeId } = req.body;
    if (!treeId) {
      return res.status(400).json({ error: 'treeId is required' });
    }
    const { session, question } = qna.startSession(treeId);
    touchSession(session.sessionId, treeId);
    res.json({ sessionId: session.sessionId, treeId: session.treeId, question });
  } catch (err) {
    next(err);
  }
});

// GET /api/qna/:sessionId/question
router.get('/:sessionId/question', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const question = qna.getCurrentQuestion(sessionId);
    touchSession(sessionId);
    res.json({ question });
  } catch (err) {
    next(err);
  }
});

// POST /api/qna/:sessionId/answer
router.post('/:sessionId/answer', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }
    const result = qna.submitAnswer(sessionId, value);
    touchSession(sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/qna/:sessionId
router.delete('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    qna.destroySession(sessionId);
    sessionMeta.delete(sessionId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
