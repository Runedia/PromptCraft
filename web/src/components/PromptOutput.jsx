import { useClipboard } from '../hooks/useClipboard'

export default function PromptOutput({ prompt, tokenEstimate, onReset }) {
  const { copied, copy } = useClipboard()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">생성된 프롬프트</h2>
        <div className="flex items-center gap-3">
          {tokenEstimate && (
            <span className="text-xs text-gray-500">약 {tokenEstimate.toLocaleString()} 토큰</span>
          )}
          <button
            onClick={() => copy(prompt)}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {copied ? '복사됨!' : '클립보드 복사'}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            다시 만들기
          </button>
        </div>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
        {prompt}
      </pre>
    </div>
  )
}
