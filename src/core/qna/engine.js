'use strict';

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { validate } = require('./validator');
const { QnAError } = require('../../shared/errors');
const { suggestRoles } = require('./role-suggester');

const TREES_DIR = path.join(__dirname, '../../../data/trees');

const treeCache = new Map();
const sessions = new Map();

function resolveNodeOptions(node, session) {
  if (!node) return null;
  if (node.optionsSource === 'scan.suggestedRoles') {
    return suggestRoles(session && session.scanResult ? session.scanResult : null);
  }
  return node.options || null;
}

function loadTree(treeId) {
  if (treeCache.has(treeId)) {
    return treeCache.get(treeId);
  }
  const filePath = path.join(TREES_DIR, `${treeId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new QnAError(`트리를 찾을 수 없습니다: ${treeId}`);
  }
  const tree = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  treeCache.set(treeId, tree);
  return tree;
}

function createSession(treeId, options = {}) {
  const tree = loadTree(treeId);
  const sessionId = randomUUID();
  const session = {
    sessionId,
    treeId,
    currentNodeId: tree.startNodeId || tree.startNode,
    answers: {},
    completed: false,
    scanResult: options.scanResult || null,
  };
  sessions.set(sessionId, session);
  return { ...session };
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new QnAError(`세션을 찾을 수 없습니다: ${sessionId}`);
  }
  return { ...session, answers: { ...session.answers } };
}

function getCurrentQuestion(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new QnAError(`세션을 찾을 수 없습니다: ${sessionId}`);
  }
  if (session.completed) {
    throw new QnAError('세션이 이미 완료되었습니다.');
  }
  const tree = loadTree(session.treeId);
  const node = tree.nodes[session.currentNodeId];
  if (!node) {
    throw new QnAError(`노드를 찾을 수 없습니다: ${session.currentNodeId}`);
  }
  const options = resolveNodeOptions(node, session);

  return {
    nodeId: node.id,
    question: node.question,
    key: node.answerKey || node.key,
    inputType: node.inputType,
    required: node.required,
    options,
    hint: node.hint || null,
    placeholder: node.placeholder || null,
    examples: Array.isArray(node.examples) ? node.examples : null,
  };
}

function submitAnswer(sessionId, value) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new QnAError(`세션을 찾을 수 없습니다: ${sessionId}`);
  }
  if (session.completed) {
    throw new QnAError('세션이 이미 완료되었습니다.');
  }
  const tree = loadTree(session.treeId);
  const node = tree.nodes[session.currentNodeId];
  if (!node) {
    throw new QnAError(`노드를 찾을 수 없습니다: ${session.currentNodeId}`);
  }

  const result = validate({
    ...node,
    options: resolveNodeOptions(node, session),
  }, value);
  if (!result.valid) {
    return { success: false, error: result.error };
  }

  const answerKey = node.answerKey || node.key;
  session.answers[answerKey] = value;

  let nextNodeId = null;
  const branches = node.branches || node.branchOn;
  if (branches && branches[value] !== undefined) {
    nextNodeId = branches[value];
  } else {
    nextNodeId = node.next;
  }

  if (nextNodeId === null) {
    session.completed = true;
  } else {
    session.currentNodeId = nextNodeId;
  }

  return { success: true, completed: session.completed };
}

function getAnswers(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new QnAError(`세션을 찾을 수 없습니다: ${sessionId}`);
  }
  if (!session.completed) {
    throw new QnAError('세션이 아직 완료되지 않았습니다.');
  }
  return { ...session.answers };
}

function destroySession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  loadTree,
  createSession,
  getSession,
  getCurrentQuestion,
  submitAnswer,
  getAnswers,
  destroySession,
};
