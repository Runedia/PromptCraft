'use strict';

const SESSION_TTL = 30 * 60 * 1000; // 30min

function startSessionCleaner(sessionMap) {
  return setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessionMap.entries()) {
      if (now - session.lastAccessedAt > SESSION_TTL) {
        sessionMap.delete(id);
      }
    }
  }, 5 * 60 * 1000); // every 5min
}

module.exports = { startSessionCleaner };
