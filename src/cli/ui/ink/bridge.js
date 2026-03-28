'use strict';

// React 18/19: CJS require 가능
const React = require('react');

let _inkModule = null;

async function loadInk() {
  if (!_inkModule) {
    _inkModule = await import('ink');
  }
  return _inkModule;
}

module.exports = { React, loadInk };
