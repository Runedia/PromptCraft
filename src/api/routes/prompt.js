'use strict';

const express = require('express');
const router = express.Router();
const qna = require('../../core/qna');
const { buildPrompt, estimateTokenCount } = require('../../core/prompt');
const db = require('../../core/db');
const { QNA_TREE_LABELS } = require('../../shared/constants');

// POST /api/prompt/build
router.post('/build', (req, res, next) => {
  try {
    const { sessionId, scanResult } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = qna.getSession(sessionId);
    const answers = qna.getAnswers(sessionId);
    const prompt = buildPrompt(session.treeId, answers, scanResult || null);
    const tokenEstimate = estimateTokenCount(prompt);

    // Save to history
    db.history.save({
      treeId: session.treeId,
      situation: QNA_TREE_LABELS[session.treeId] || session.treeId,
      prompt,
      scanPath: scanResult ? scanResult.path : null,
      answers,
    });

    res.json({ prompt, tokenEstimate });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
