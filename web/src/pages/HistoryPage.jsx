import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useClipboard } from '../hooks/useClipboard'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const { copied, copy } = useClipboard()

  useEffect(() => {
    api.getHistory().then(d => setHistory(d.history || [])).catch(() => {})
  }, [])

  const handleDelete = async (id) => {
    await api.deleteHistory(id).catch(() => {})
    setHistory(h => h.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">빌드 히스토리</h1>
      {history.length === 0 && <p className="text-gray-500">아직 히스토리가 없습니다.</p>}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 space-y-2">
          {history.map(entry => (
            <button
              key={entry.id}
              onClick={() => setSelected(entry)}
              className={`w-full text-left p-3 rounded border text-sm ${selected?.id === entry.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
            >
              <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString('ko-KR')}</div>
              <div className="truncate text-gray-800 mt-0.5">{entry.treeId}</div>
            </button>
          ))}
        </div>
        {selected && (
          <div className="col-span-2 bg-white border border-gray-200 rounded p-4">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium">{selected.treeId}</span>
              <div className="flex gap-2">
                <button onClick={() => copy(selected.prompt)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">
                  {copied ? '복사됨' : '복사'}
                </button>
                <button onClick={() => handleDelete(selected.id)} className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded">
                  삭제
                </button>
              </div>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-auto max-h-96">{selected.prompt}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
