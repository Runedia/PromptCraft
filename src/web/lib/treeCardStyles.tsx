import { BookOpen, Bug, GitPullRequest, Wrench, Zap } from 'lucide-react';
import type React from 'react';

type TreeCardStyle = {
  icon: (size?: number) => React.ReactNode;
  iconBg: string;
  iconColor: string;
};

const CARD_STYLES: Record<string, TreeCardStyle> = {
  'error-solving': {
    icon: (size = 20) => <Bug size={size} />,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
  'feature-impl': {
    icon: (size = 20) => <Zap size={size} />,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  'code-review': {
    icon: (size = 20) => <GitPullRequest size={size} />,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  'concept-learn': {
    icon: (size = 20) => <BookOpen size={size} />,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  refactoring: {
    icon: (size = 20) => <Wrench size={size} />,
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
  },
};

const DEFAULT_CARD_STYLE: TreeCardStyle = {
  icon: (size = 20) => <Zap size={size} />,
  iconBg: 'bg-primary/10',
  iconColor: 'text-primary',
};

export function getTreeCardStyle(treeId: string): TreeCardStyle {
  return CARD_STYLES[treeId] ?? DEFAULT_CARD_STYLE;
}
