import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QnAError } from '../../shared/errors.js';
import type {
  QnAAnswers,
  QnAOption,
  QnAQuestion,
  QnASession,
  QnASubmitResult,
  QnATree,
  QnATreeNode,
  ScanResult,
} from '../types.js';
import { suggestRoles } from './role-suggester.js';
import { validate } from './validator.js';

const __filename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(__filename);

const TREES_DIR = path.join(moduleDirname, '../../../data/trees');

const treeCache = new Map<string, QnATree>();
const sessions = new Map<string, QnASession>();

function resolveNodeOptions(
  node: QnATreeNode | null | undefined,
  session: QnASession | null
): QnAOption[] | null {
  if (!node) return null;
  if (node.optionsSource === 'scan.suggestedRoles') {
    return suggestRoles(session?.scanResult ? session.scanResult : null);
  }
  return node.options || null;
}

function loadTree(treeId: string): QnATree {
  const cached = treeCache.get(treeId);
  if (cached !== undefined) {
    return cached;
  }
  const filePath = path.join(TREES_DIR, `${treeId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new QnAError(`트리를 찾을 수 없습니다: ${treeId}`);
  }
  const tree = JSON.parse(fs.readFileSync(filePath, 'utf8')) as QnATree;
  treeCache.set(treeId, tree);
  return tree;
}

function createSession(
  treeId: string,
  options: { scanResult?: ScanResult | null } = {}
): QnASession {
  const tree = loadTree(treeId);
  const startNodeId = tree.startNodeId || tree.startNode;
  if (!startNodeId) {
    throw new QnAError(`트리 시작 노드가 없습니다: ${treeId}`);
  }
  const sessionId = randomUUID();
  const session: QnASession = {
    sessionId,
    treeId,
    currentNodeId: startNodeId,
    answers: {},
    completed: false,
    scanResult: options.scanResult || null,
  };
  sessions.set(sessionId, session);
  return { ...session };
}

function getSession(sessionId: string): QnASession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new QnAError(`세션을 찾을 수 없습니다: ${sessionId}`);
  }
  return { ...session, answers: { ...session.answers } };
}

function getCurrentQuestion(sessionId: string): QnAQuestion {
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
    key: node.answerKey || node.key || node.id,
    inputType: node.inputType,
    required: Boolean(node.required),
    options,
    hint: node.hint || null,
    placeholder: node.placeholder || null,
    examples: Array.isArray(node.examples) ? node.examples : null,
  };
}

function submitAnswer(sessionId: string, value: string): QnASubmitResult {
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

  const result = validate(
    {
      ...node,
      options: resolveNodeOptions(node, session),
    },
    value
  );
  if (!result.valid) {
    return { success: false, error: result.error };
  }

  const answerKey = node.answerKey || node.key || node.id;
  session.answers[answerKey] = value;

  let nextNodeId: string | null | undefined = null;
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

function getAnswers(sessionId: string): QnAAnswers {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new QnAError(`세션을 찾을 수 없습니다: ${sessionId}`);
  }
  if (!session.completed) {
    throw new QnAError('세션이 아직 완료되지 않았습니다.');
  }
  return { ...session.answers };
}

function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export {
  createSession,
  destroySession,
  getAnswers,
  getCurrentQuestion,
  getSession,
  loadTree,
  submitAnswer,
};
