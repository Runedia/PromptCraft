// React 18/19: CJS require 가능
import React from 'react';

let _inkModule = null;

async function loadInk() {
  if (!_inkModule) {
    _inkModule = await import('ink');
  }
  return _inkModule;
}

export { loadInk, React };
