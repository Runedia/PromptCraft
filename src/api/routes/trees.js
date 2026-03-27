'use strict';

const express = require('express');
const router = express.Router();
const { QNA_TREE_IDS, QNA_TREE_LABELS, QNA_TREE_DESCRIPTIONS } = require('../../shared/constants');

// GET /api/trees
router.get('/', (req, res) => {
  const trees = Object.values(QNA_TREE_IDS).map(id => ({
    id,
    name: QNA_TREE_LABELS[id] || id,
    description: QNA_TREE_DESCRIPTIONS[id] || '',
  }));
  res.json({ trees });
});

module.exports = router;
