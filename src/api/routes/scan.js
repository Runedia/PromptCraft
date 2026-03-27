'use strict';

const express = require('express');
const router = express.Router();
const { scan } = require('../../core/scanner');

// POST /api/scan
router.post('/', async (req, res, next) => {
  try {
    const { path: scanPath, depth } = req.body;
    if (!scanPath) {
      return res.status(400).json({ error: 'path is required' });
    }
    const options = {};
    if (depth != null) options.depth = depth;
    const result = await scan(scanPath, options);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
