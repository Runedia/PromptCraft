import { BookOpen, Bug, GitPullRequest, Wrench, Zap } from 'lucide-react';
import type React from 'react';

type TreeCardStyle = {
  icon: (size?: number) => React.ReactNode;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
};

const CARD_STYLES: Record<string, TreeCardStyle> = {
  'error-solving': {
    icon: (size = 20) => <Bug size={size} />,
    borderColor: 'border-t-destructive',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    hoverBorder: 'hover:border-destructive',
  },
  'feature-impl': {
    icon: (size = 20) => <Zap size={size} />,
    borderColor: 'border-t-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    hoverBorder: 'hover:border-success',
  },
  'code-review': {
    icon: (size = 20) => <GitPullRequest size={size} />,
    borderColor: 'border-t-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    hoverBorder: 'hover:border-primary',
  },
  'concept-learn': {
    icon: (size = 20) => <BookOpen size={size} />,
    borderColor: 'border-t-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    hoverBorder: 'hover:border-warning',
  },
  refactoring: {
    icon: (size = 20) => <Wrench size={size} />,
    borderColor: 'border-t-cyan-500',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    hoverBorder: 'hover:border-cyan-500',
  },
};

const DEFAULT_CARD_STYLE: TreeCardStyle = {
  icon: (size = 20) => <Zap size={size} />,
  borderColor: 'border-t-primary',
  iconBg: 'bg-primary/10',
  iconColor: 'text-primary',
  hoverBorder: 'hover:border-primary',
};

export function getTreeCardStyle(treeId: string): TreeCardStyle {
  return CARD_STYLES[treeId] ?? DEFAULT_CARD_STYLE;
}
