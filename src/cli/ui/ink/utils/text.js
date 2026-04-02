'use strict';

let cachedSegmenter = null;

function getSegmenter() {
  if (cachedSegmenter) return cachedSegmenter;
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return null;
  cachedSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return cachedSegmenter;
}

function removeLastGrapheme(value) {
  if (!value) return '';
  const segmenter = getSegmenter();
  if (!segmenter) {
    return Array.from(value).slice(0, -1).join('');
  }
  const graphemes = Array.from(segmenter.segment(value), part => part.segment);
  graphemes.pop();
  return graphemes.join('');
}

module.exports = { removeLastGrapheme };
