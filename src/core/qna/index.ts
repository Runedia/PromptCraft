import type { QnAQuestion, QnASession, ScanResult } from '../types.js';
import * as engine from './engine.js';

function startSession(
  treeId: string,
  options: { scanResult?: ScanResult | null; presetId?: string | null } = {}
): { session: QnASession; question: QnAQuestion } {
  const session = engine.createSession(treeId, options);
  const question = engine.getCurrentQuestion(session.sessionId);
  return { session, question };
}

const loadTree = engine.loadTree;
const createSession = engine.createSession;
const getSession = engine.getSession;
const getCurrentQuestion = engine.getCurrentQuestion;
const submitAnswer = engine.submitAnswer;
const getAnswers = engine.getAnswers;
const destroySession = engine.destroySession;

export {
  createSession,
  destroySession,
  getAnswers,
  getCurrentQuestion,
  getSession,
  loadTree,
  startSession,
  submitAnswer,
};
