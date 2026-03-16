'use strict';

const engine = require('./engine');

function startSession(treeId) {
  const session = engine.createSession(treeId);
  const question = engine.getCurrentQuestion(session.sessionId);
  return { session, question };
}

module.exports = {
  startSession,
  loadTree: engine.loadTree,
  createSession: engine.createSession,
  getSession: engine.getSession,
  getCurrentQuestion: engine.getCurrentQuestion,
  submitAnswer: engine.submitAnswer,
  getAnswers: engine.getAnswers,
  destroySession: engine.destroySession,
};
