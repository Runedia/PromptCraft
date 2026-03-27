'use strict';

const express = require('express');
const router = express.Router();
const db = require('../../core/db');

// GET /api/templates
router.get('/', (req, res, next) => {
  try {
    const templates = db.template.findAll();
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/:id
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const template = db.template.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (err) {
    next(err);
  }
});

// POST /api/templates
router.post('/', (req, res, next) => {
  try {
    const { name, treeId, answers } = req.body;
    if (!name || !treeId || !answers) {
      return res.status(400).json({ error: 'name, treeId, and answers are required' });
    }
    const id = db.template.save({ name, treeId, answers });
    const template = db.template.findById(id);
    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/templates/:id
router.delete('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const changes = db.template.delete(id);
    if (changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
