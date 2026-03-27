import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQnA } from '../hooks/useQnA'
import { useScan } from '../hooks/useScan'
import TreeSelector from '../components/TreeSelector'
import QuestionCard from '../components/QuestionCard'
import PromptOutput from '../components/PromptOutput'
import ScanPanel from '../components/ScanPanel'

export default function BuildPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state: qnaState, question, prompt, tokenEstimate, error, start, answer, reset } = useQnA()
  const { scanResult, scanning, error: scanError, scan } = useScan()
  const [selectedTree, setSelectedTree] = useState(location.state?.treeId || null)

  useEffect(() => {
    if (selectedTree && qnaState === 'idle') {
      start(selectedTree, scanResult)
    }
  }, [selectedTree])

  const handleTreeSelect = (treeId) => {
    setSelectedTree(treeId)
    start(treeId, scanResult)
  }

  const handleReset = () => {
    reset()
    setSelectedTree(null)
  }

  return (
    <div className="space-y-6">
      <ScanPanel onScan={scan} scanning={scanning} scanResult={scanResult} error={scanError} />

      {qnaState === 'idle' && !selectedTree && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">질문 유형 선택</h2>
          <TreeSelector onSelect={handleTreeSelect} />
        </div>
      )}

      {(qnaState === 'loading' || qnaState === 'submitting' || qnaState === 'building') && (
        <div className="text-center py-8 text-gray-500">처리 중...</div>
      )}

      {qnaState === 'questioning' && question && (
        <QuestionCard
          question={question}
          onSubmit={(val) => answer(val, scanResult)}
          disabled={false}
        />
      )}

      {qnaState === 'done' && prompt && (
        <PromptOutput prompt={prompt} tokenEstimate={tokenEstimate} onReset={handleReset} />
      )}

      {qnaState === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
          <button onClick={handleReset} className="ml-4 text-sm underline">다시 시작</button>
        </div>
      )}
    </div>
  )
}
