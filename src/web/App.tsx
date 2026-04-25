import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner.js';
import { TooltipProvider } from '@/components/ui/tooltip.js';
import { TreeSelect } from './components/TreeSelect/TreeSelect.js';
import { WorkspacePage } from './pages/WorkspacePage.js';

type Page = { type: 'tree-select' } | { type: 'workspace'; treeId: string; projectPath: string };

export function App() {
  const [page, setPage] = useState<Page>(() => {
    const state = history.state as Page | null;
    return state?.type === 'workspace' ? state : { type: 'tree-select' };
  });

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as Page | null;
      setPage(state?.type === 'workspace' ? state : { type: 'tree-select' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTreeSelect = (treeId: string, projectPath: string) => {
    const newPage: Page = { type: 'workspace', treeId, projectPath };
    history.pushState(newPage, '', `/workspace/${treeId}`);
    setPage(newPage);
  };

  const handleBack = () => {
    history.pushState({ type: 'tree-select' }, '', '/');
    setPage({ type: 'tree-select' });
  };

  const content = (() => {
    switch (page.type) {
      case 'tree-select':
        return <TreeSelect onSelect={handleTreeSelect} />;
      case 'workspace':
        return <WorkspacePage treeId={page.treeId} projectPath={page.projectPath} onBack={handleBack} />;
    }
  })();

  return (
    <TooltipProvider>
      {content}
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}
