'use strict';

const express = require('express');
const router = express.Router();
const db = require('../../core/db');

// GET /api/history
router.get('/', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const history = db.history.findAll({ limit, offset });
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

// GET /api/history/:id
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const entry = db.history.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/history/:id
router.delete('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const changes = db.history.delete(id);
    if (changes === 0) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
