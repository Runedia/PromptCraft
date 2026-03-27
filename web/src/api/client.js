const BASE = 'http://localhost:3000/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  getTrees: () => request('GET', '/trees'),
  scan: (path) => request('POST', '/scan', { path }),
  createSession: (treeId) => request('POST', '/qna/session', { treeId }),
  getQuestion: (sessionId) => request('GET', `/qna/${sessionId}/question`),
  submitAnswer: (sessionId, value) => request('POST', `/qna/${sessionId}/answer`, { value }),
  deleteSession: (sessionId) => request('DELETE', `/qna/${sessionId}`),
  buildPrompt: (sessionId, scanResult) => request('POST', '/prompt/build', { sessionId, scanResult }),
  getHistory: () => request('GET', '/history'),
  deleteHistory: (id) => request('DELETE', `/history/${id}`),
  listFiles: (root, subpath) => request('GET', `/files?root=${encodeURIComponent(root)}&subpath=${encodeURIComponent(subpath || '')}`),
  getFileContent: (root, path) => request('GET', `/files/content?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`),
}
