import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderOpen, X, Bug, Zap, GitPullRequest, BookOpen } from 'lucide-react';
import { FolderBrowser } from '../FolderBrowser/FolderBrowser.js';
import type { TreeConfig } from '../../../core/types/card.js';
import { useCardStore } from '../../store/cardStore.js';

interface TreeSelectProps {
  onSelect: (treeId: string, projectPath: string) => void;
}

// 카드별 고정 스타일 맵 (tree.id 기반)
const CARD_STYLES: Record<
  string,
  {
    icon: React.ReactNode;
    borderColor: string;
    iconBg: string;
    iconColor: string;
    hoverBorder: string;
  }
> = {
  'error-solving': {
    icon: <Bug size={20} />,
    borderColor: 'border-t-accent-danger',
    iconBg: 'bg-accent-danger/10',
    iconColor: 'text-accent-danger',
    hoverBorder: 'hover:border-accent-danger',
  },
  'feature-impl': {
    icon: <Zap size={20} />,
    borderColor: 'border-t-accent-success',
    iconBg: 'bg-accent-success/10',
    iconColor: 'text-accent-success',
    hoverBorder: 'hover:border-accent-success',
  },
  'code-review': {
    icon: <GitPullRequest size={20} />,
    borderColor: 'border-t-accent-primary',
    iconBg: 'bg-accent-primary/10',
    iconColor: 'text-accent-primary',
    hoverBorder: 'hover:border-accent-primary',
  },
  'concept-learn': {
    icon: <BookOpen size={20} />,
    borderColor: 'border-t-accent-warning',
    iconBg: 'bg-accent-warning/10',
    iconColor: 'text-accent-warning',
    hoverBorder: 'hover:border-accent-warning',
  },
};

const DEFAULT_CARD_STYLE = {
  icon: <Zap size={20} />,
  borderColor: 'border-t-accent-primary',
  iconBg: 'bg-accent-primary/10',
  iconColor: 'text-accent-primary',
  hoverBorder: 'hover:border-accent-primary',
};

export function TreeSelect({ onSelect }: TreeSelectProps) {
  const SESSION_PATH_KEY = 'promptcraft:projectPath';

  const { setScanResult } = useCardStore();
  const [trees, setTrees] = useState<Pick<TreeConfig, 'id' | 'label' | 'description' | 'icon'>[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [projectPath, setProjectPath] = useState(
    () => sessionStorage.getItem(SESSION_PATH_KEY) ?? ''
  );
  const [showBrowser, setShowBrowser] = useState(false);
  const [isPreScanning, setIsPreScanning] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/trees')
      .then((r) => r.json())
      .then(setTrees)
      .finally(() => {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
  }, []);

  // 경로 변경 시 debounce 800ms 후 사전 스캔 → 역할 제안 생성
  useEffect(() => {
    setSuggestedRoles([]);
    if (projectPath.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsPreScanning(true);
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: projectPath }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const result = await res.json();
        setScanResult(result);

        // buildRoleOptions와 동일한 로직: 프레임워크 기반 우선, 최대 5개
        const frameworkRoles = (result.frameworks as { name: string }[])
          .slice(0, 3)
          .map((f) => `${f.name} 개발자`);
        const baseRoles = ['TypeScript 개발자', '백엔드 엔지니어', '풀스택 개발자', 'DevOps 엔지니어'];
        const seen = new Set<string>();
        const roles: string[] = [];
        for (const r of [...frameworkRoles, ...baseRoles]) {
          if (!seen.has(r)) {
            seen.add(r);
            roles.push(r);
          }
          if (roles.length >= 5) break;
        }
        setSuggestedRoles(roles);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSuggestedRoles([]);
      } finally {
        setIsPreScanning(false);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setIsPreScanning(false);
    };
  }, [projectPath, setScanResult]);

  const handleBrowseSelect = useCallback((selected: string) => {
    setProjectPath(selected);
    sessionStorage.setItem(SESSION_PATH_KEY, selected);
    setShowBrowser(false);
    inputRef.current?.focus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
          <span className="text-sm text-text-muted">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-10 bg-bg-primary">
      {/* 히어로 섹션 */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <span className="text-xs font-semibold text-accent-primary tracking-widest uppercase">
            AI Coding Assistant
          </span>
          <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-text-primary">Prompt</span>
          <span className="text-accent-primary">Craft</span>
        </h1>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          상황을 선택하면 단 한 번의 완벽한 AI 프롬프트를 <br /> 자동으로 생성합니다
        </p>
      </div>

      {/* 프로젝트 경로 입력 */}
      <div className="w-full mx-10 max-w-[600px] flex flex-col gap-4 p-6 bg-bg-secondary rounded-2xl border border-border-subtle shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-primary/10">
            <FolderOpen size={15} className="text-accent-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">
              대상 프로젝트 경로
            </p>
            <p className="text-xs text-text-muted">경로를 입력하면 프로젝트를 자동 스캔합니다</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-bg-primary border border-border-subtle rounded-lg text-text-primary pl-4 pr-8 py-2.5 text-sm font-code transition-colors outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 placeholder:text-text-muted"
              value={projectPath}
              onChange={(e) => {
                setProjectPath(e.target.value);
                sessionStorage.setItem(SESSION_PATH_KEY, e.target.value);
              }}
              placeholder="예: C:/my-project  또는  /home/user/project"
              spellCheck={false}
            />
            {projectPath && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded text-text-muted transition-colors hover:text-text-primary cursor-pointer"
                onClick={() => {
                  setProjectPath('');
                  sessionStorage.removeItem(SESSION_PATH_KEY);
                  inputRef.current?.focus();
                }}
                title="경로 지우기"
                tabIndex={-1}
                aria-label="경로 지우기"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2.5 transition-all border border-border-subtle bg-bg-tertiary text-text-secondary hover:bg-border hover:text-text-primary shrink-0 cursor-pointer"
            onClick={() => setShowBrowser(true)}
            title="폴더 탐색기로 선택"
          >
            <FolderOpen size={14} />
            탐색
          </button>
        </div>

        {/* 역할 제안 칩 */}
        {(isPreScanning || suggestedRoles.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {isPreScanning ? (
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full border border-text-muted border-t-transparent animate-spin" />
                분석 중...
              </span>
            ) : (
              <>
                <span className="text-xs text-text-muted shrink-0">예상 역할:</span>
                {suggestedRoles.map((role) => (
                  <span
                    key={role}
                    className="text-xs rounded-full px-2 py-0.5 bg-bg-tertiary border border-border-subtle text-text-muted"
                  >
                    {role}
                  </span>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 상황 선택 제목 */}
      <div className="flex items-center gap-3 w-full max-w-[600px]">
        <div className="flex-1 h-px bg-border-subtle" />
        <p className="text-xs font-semibold text-text-muted tracking-widest uppercase whitespace-nowrap">
          상황을 선택하세요
        </p>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      {/* 상황 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[600px] -mt-4">
        {trees.map((tree) => {
          const style = CARD_STYLES[tree.id] ?? DEFAULT_CARD_STYLE;
          return (
            <button
              key={tree.id}
              type="button"
              className={[
                'group flex flex-col items-start gap-4 p-6',
                'bg-bg-secondary rounded-2xl text-left cursor-pointer',
                'border border-border-subtle border-t-[3px]',
                style.borderColor,
                'shadow-[0_2px_12px_rgba(0,0,0,0.4)]',
                'transition-all duration-200',
                'hover:shadow-[0_8px_28px_rgba(0,0,0,0.55)] hover:-translate-y-1',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
                'active:translate-y-0',
              ].join(' ')}
              onClick={() => onSelect(tree.id, projectPath.trim())}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${style.iconBg} ${style.iconColor} transition-transform duration-200 group-hover:scale-110`}
              >
                {style.icon}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-text-primary leading-tight">
                  {tree.label}
                </span>
                <span className="text-xs text-text-muted leading-relaxed">{tree.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showBrowser && (
        <FolderBrowser
          initialPath={projectPath || undefined}
          onSelect={handleBrowseSelect}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
