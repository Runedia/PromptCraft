import { useState } from 'react'

export default function ScanPanel({ onScan, scanning, scanResult, error }) {
  const [path, setPath] = useState('')

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <p className="text-sm font-medium text-blue-800 mb-2">프로젝트 스캔 (선택)</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={path}
          onChange={e => setPath(e.target.value)}
          placeholder="/path/to/your/project"
          className="flex-1 px-3 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={() => onScan(path)}
          disabled={scanning || !path.trim()}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {scanning ? '스캔 중...' : '스캔'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {scanResult && (
        <p className="text-xs text-blue-600 mt-1">
          스캔 완료: {scanResult.languages?.[0]?.name || '알 수 없음'} 프로젝트
        </p>
      )}
    </div>
  )
}
