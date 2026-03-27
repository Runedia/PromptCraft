import { useState, useCallback } from 'react'
import { api } from '../api/client'

// 상태: idle -> loading -> questioning -> submitting -> building -> done | error
export function useQnA() {
  const [state, setState] = useState('idle')
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [prompt, setPrompt] = useState(null)
  const [tokenEstimate, setTokenEstimate] = useState(null)
  const [error, setError] = useState(null)

  const start = useCallback(async (treeId, scanResult) => {
    setState('loading')
    setError(null)
    try {
      const { sessionId: sid, question: q } = await api.createSession(treeId)
      setSessionId(sid)
      setQuestion(q)
      setState('questioning')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }, [])

  const answer = useCallback(async (value, scanResult) => {
    if (!sessionId) return
    setState('submitting')
    try {
      const res = await api.submitAnswer(sessionId, value)
      if (res.completed) {
        setState('building')
        const built = await api.buildPrompt(sessionId, scanResult)
        setPrompt(built.prompt)
        setTokenEstimate(built.tokenEstimate)
        setState('done')
      } else {
        setQuestion(res.nextQuestion)
        setState('questioning')
      }
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }, [sessionId])

  const reset = useCallback(() => {
    if (sessionId) api.deleteSession(sessionId).catch(() => {})
    setState('idle')
    setSessionId(null)
    setQuestion(null)
    setPrompt(null)
    setTokenEstimate(null)
    setError(null)
  }, [sessionId])

  return { state, question, prompt, tokenEstimate, error, start, answer, reset }
}
