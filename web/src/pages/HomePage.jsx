import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TreeSelector from '../components/TreeSelector'
import { api } from '../api/client'

export default function HomePage() {
  const navigate = useNavigate()
  const [recentHistory, setRecentHistory] = useState([])

  useEffect(() => {
    api.getHistory().then(d => setRecentHistory((d.history || []).slice(0, 3))).catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">PromptCraft</h1>
        <p className="text-gray-500">단 한 번의 완벽한 질문으로 AI 응답을 최적화하세요.</p>
      </div>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">무엇을 도와드릴까요?</h2>
        <TreeSelector onSelect={(treeId) => navigate('/build', { state: { treeId } })} />
      </div>

      {recentHistory.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">최근 빌드</h2>
          <div className="space-y-2">
            {recentHistory.map(entry => (
              <div key={entry.id} className="p-3 bg-white border border-gray-200 rounded text-sm">
                <div className="text-gray-500 text-xs">{new Date(entry.createdAt).toLocaleString('ko-KR')}</div>
                <div className="text-gray-800 truncate mt-0.5">{entry.prompt?.slice(0, 100)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
