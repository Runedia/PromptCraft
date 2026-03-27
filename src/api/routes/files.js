'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { readMentionedFile } = require('../../cli/ui/file-mention');

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pdf', '.docx', '.xlsx', '.pptx',
  '.mp3', '.mp4', '.avi', '.mov',
  '.ttf', '.woff', '.woff2', '.eot',
]);

const MAX_FILE_SIZE = 100 * 1024;
const MAX_LINES = 200;

/**
 * Validate that the resolved path is within the root directory
 */
function isPathSafe(root, target) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(target);
  return normalizedTarget.startsWith(normalizedRoot + path.sep) || normalizedTarget === normalizedRoot;
}

// GET /api/files?root=/path&subpath=src
router.get('/', (req, res, next) => {
  try {
    const { root, subpath } = req.query;
    if (!root) {
      return res.status(400).json({ error: 'root is required' });
    }

    const dirPath = subpath ? path.join(root, subpath) : root;

    if (!isPathSafe(root, dirPath)) {
      return res.status(403).json({ error: 'Path traversal not allowed' });
    }

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(dirent => {
        const name = dirent.name;
        // Hide .env files and common hidden/build directories
        if (name === '.env' || name.startsWith('.env.')) return false;
        if (name === 'node_modules' || name === '.git') return false;
        return true;
      })
      .map(dirent => ({
        name: dirent.name,
        type: dirent.isDirectory() ? 'directory' : 'file',
        path: subpath ? path.posix.join(subpath, dirent.name) : dirent.name,
      }))
      .sort((a, b) => {
        // directories first, then alphabetical
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/files/content?root=/path&path=src/foo.js
router.get('/content', (req, res, next) => {
  try {
    const { root, path: filePath } = req.query;
    if (!root || !filePath) {
      return res.status(400).json({ error: 'root and path are required' });
    }

    const absPath = path.resolve(root, filePath);
    if (!isPathSafe(root, absPath)) {
      return res.status(403).json({ error: 'Path traversal not allowed' });
    }

    // Block .env files
    const basename = path.basename(absPath);
    if (basename === '.env' || basename.startsWith('.env.')) {
      return res.status(403).json({ error: '.env files are not accessible' });
    }

    // Block binary files
    const ext = path.extname(absPath).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      return res.status(422).json({ error: 'Binary files cannot be read' });
    }

    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(absPath);
    const content = fs.readFileSync(absPath, 'utf8');
    const lines = content.split('\n');
    let truncated = false;

    let resultContent = content;
    if (stat.size > MAX_FILE_SIZE || lines.length > MAX_LINES) {
      resultContent = lines.slice(0, MAX_LINES).join('\n');
      truncated = true;
    }

    res.json({
      content: resultContent,
      lines: truncated ? MAX_LINES : lines.length,
      truncated,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
