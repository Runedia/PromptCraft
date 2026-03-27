const TREES = [
  { id: 'error-solving', name: '에러 해결', description: '에러 메시지와 스택 트레이스를 분석하여 해결책을 찾습니다', icon: '🔧' },
  { id: 'feature-impl', name: '기능 구현', description: '새 기능을 구현하기 위한 단계별 가이드를 제공합니다', icon: '✨' },
  { id: 'code-review', name: '코드 리뷰', description: '코드의 품질, 성능, 보안을 검토합니다', icon: '🔍' },
  { id: 'concept-learn', name: '개념 학습', description: '기술 개념을 이해하기 쉽게 설명해줍니다', icon: '📚' },
]

export default function TreeSelector({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {TREES.map(tree => (
        <button
          key={tree.id}
          onClick={() => onSelect(tree.id)}
          className="p-5 bg-white border border-gray-200 rounded-lg text-left hover:border-indigo-400 hover:shadow-sm transition-all"
        >
          <div className="text-2xl mb-2">{tree.icon}</div>
          <div className="font-semibold text-gray-900">{tree.name}</div>
          <div className="text-sm text-gray-500 mt-1">{tree.description}</div>
        </button>
      ))}
    </div>
  )
}
