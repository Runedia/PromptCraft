import { useState } from 'react'

export default function QuestionCard({ question, onSubmit, disabled }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (question.required && !value.trim()) return
    onSubmit(value)
    setValue('')
  }

  const handleSelectSubmit = (val) => {
    onSubmit(val)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="font-medium text-gray-900 mb-4">{question.question}</p>

      {question.inputType === 'select' && (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <button
              key={opt}
              onClick={() => handleSelectSubmit(opt)}
              disabled={disabled}
              className="block w-full text-left px-4 py-2 border border-gray-200 rounded hover:bg-indigo-50 hover:border-indigo-300 transition-colors disabled:opacity-50"
            >
              {opt}
            </button>
          ))}
          {!question.required && (
            <button
              onClick={() => handleSelectSubmit('')}
              disabled={disabled}
              className="block w-full text-left px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              건너뛰기
            </button>
          )}
        </div>
      )}

      {(question.inputType === 'text') && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={disabled}
            placeholder={question.required ? '필수 입력' : '선택 입력'}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="submit"
            disabled={disabled || (question.required && !value.trim())}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
          {!question.required && (
            <button type="button" onClick={() => onSubmit('')} className="ml-2 px-4 py-2 text-gray-500 hover:text-gray-700">
              건너뛰기
            </button>
          )}
        </form>
      )}

      {(question.inputType === 'multiline' || question.inputType === 'multiline-mention') && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {question.inputType === 'multiline-mention' && (
            <p className="text-xs text-gray-400">@파일경로 형식으로 입력하면 프롬프트에 파일 링크로 포함됩니다.</p>
          )}
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={disabled}
            rows={6}
            placeholder={question.required ? '필수 입력' : '선택 입력 (건너뛰려면 비워두고 제출)'}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={disabled || (question.required && !value.trim())}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
            {!question.required && (
              <button type="button" onClick={() => onSubmit('')} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                건너뛰기
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
