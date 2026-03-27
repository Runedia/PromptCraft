'use strict';

const express = require('express');
const router = express.Router();
const db = require('../../core/db');

const KNOWN_CONFIG_KEYS = ['defaultTreeId', 'defaultScanPath', 'clipboardAuto'];

// GET /api/config
router.get('/', (req, res, next) => {
  try {
    const config = {};
    for (const key of KNOWN_CONFIG_KEYS) {
      const val = db.config.get(key);
      if (val !== null) config[key] = val;
    }
    res.json({ config });
  } catch (err) {
    next(err);
  }
});

// PUT /api/config/:key
router.put('/:key', (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }
    db.config.set(key, String(value));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
