import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// remarkPlugins 배열을 모듈에서 1회 생성해 참조를 안정화한다(ReactMarkdown 내부 재초기화 방지).
const REMARK_PLUGINS = [remarkGfm];

/**
 * react-markdown + remark-gfm 렌더. PromptPreview의 rendered 모드에서만 React.lazy로 로드되므로
 * 무거운 마크다운 스택(micromark/unified/mdast/hast 등)이 초기 번들에서 제외된다.
 */
export default function MarkdownView({ label, value }: { label: string; value: string }) {
  return <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{`## ${label}\n\n${value}`}</ReactMarkdown>;
}
